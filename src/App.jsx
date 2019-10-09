import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import { SnackbarProvider, useSnackbar } from 'notistack';

const { ipcRenderer } = window.electron || {};

const useStyles = makeStyles((theme) => ({
  App: {
    width: "100%",
    padding: "8px",
    overflow: "hidden",
    textAlign: "center"
  },

  close: {
    padding: theme.spacing(0.5),
  },
}));

const urlRegex = /toutiao.com\/(\w+)\/?/i

function FunctionalApp() {
  const classes = useStyles();
  const [values, setValues] = React.useState({
    dir: "",
    url: "",
    isCrawling: false
  });

  const { enqueueSnackbar } = useSnackbar();

  const openSnackbar = (msg, options = {}) => {
    enqueueSnackbar(msg, Object.assign({ autoHideDuration: 3000 }, options));
  };

  const handleChange = (name) => (event) => {
    setValues({ ...values, [name]: event.target.value });
  };

  const handleStart = async () => {
    const { dir, url } = values;
    let [, id] = url.match(urlRegex) || [];

    if (!id) {
      openSnackbar('请输入有效的链接', { variant: 'warning' })
      return
    }

    if (!id.startsWith('i')) {
      id = 'i' + id.substr(1)
    }

    openSnackbar(`开始下载😋，${id}`, { variant: 'info' })

    updateCrawlState(true);
    ipcRenderer && ipcRenderer.send("crawl", JSON.stringify({ dir, id }));
  };

  const updateCrawlState = (state) => {
    setValues({ ...values, isCrawling: state });
  };

  const ipcCrawlListener = (event, msg) => {
    const [error, data] = msg
    if (error) {
      console.log("From main ipc [failure]:", error.message);
      openSnackbar('下载失败😭，请检查链接并重试', { variant: 'error' })
    } else {
      console.log("From main ipc [success]:", data.length);
      openSnackbar(`下载成功👌，共 ${data.length} 张图片`, { variant: 'success' })
    }
    updateCrawlState(false);
  };

  const handleSelectDirectory = () => {
    ipcRenderer && ipcRenderer.send("open-directory-dialog");
  };

  const ipcDirectoryListener = (event, data) => {
    const [dir] = data;
    console.log("selected directory:", dir);
    setValues({ ...values, dir: dir || "" });
  };

  const isDisabled = () => {
    return !values.dir || !values.url || values.isCrawling;
  };

  React.useEffect(() => {
    ipcRenderer && ipcRenderer.on("after-crawl", ipcCrawlListener);
    ipcRenderer && ipcRenderer.on("selected-directory", ipcDirectoryListener);

    return () => {
      ipcRenderer && ipcRenderer.removeListener("after-crawl", ipcCrawlListener);
      ipcRenderer && ipcRenderer.removeListener("selected-directory", ipcDirectoryListener);
    };
  });

  return (
    <div className={classes.App}>
      <header>
        <h1>Electron Spider</h1>

        <form noValidate autoComplete="true">
          <TextField
            label="目录"
            value={values.dir}
            placeholder="请选择图片存放目录"
            fullWidth
            margin="normal"
            variant="outlined"
            InputLabelProps={{
              shrink: true
            }}
            inputProps={{
              webkitdirectory: "true",
              readOnly: true
            }}
            onClick={handleSelectDirectory}
          />

          <TextField
            label="文章 ID"
            value={values.url}
            placeholder="请输入头条文章链接, 如: https://www.toutiao.com/a6704814599696286221/"
            fullWidth
            margin="normal"
            variant="outlined"
            InputLabelProps={{
              shrink: true
            }}
            onChange={handleChange("url")}
          />
        </form>

        <Button variant="contained" color="primary" disabled={isDisabled()} onClick={handleStart}>
          {values.isCrawling ? "下载中" : "下载"}
        </Button>
      </header>
    </div>
  );
}

export default function IntegrationNotistack() {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{ vertical: 'top', horizontal: 'right', }}>
      <FunctionalApp />
    </SnackbarProvider>
  );
}
