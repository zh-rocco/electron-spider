import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";

const { ipcRenderer } = window.electron || {};

const useStyles = makeStyles((theme) => ({
  App: {
    width: "100%",
    padding: "8px",
    overflow: "hidden",
    textAlign: "center"
  }
}));

export default function FunctionalApp() {
  const classes = useStyles();
  const [values, setValues] = React.useState({
    dir: "",
    url: "",
    isCrawling: false
  });

  const handleChange = (name) => (event) => {
    setValues({ ...values, [name]: event.target.value });
  };

  const handleStart = async () => {
    console.log("id:", values.url);
    updateCrawlState(true);
    ipcRenderer && ipcRenderer.send("crawl", JSON.stringify({ dir: values.dir, id: values.url }));
  };

  const updateCrawlState = (state) => {
    setValues({ ...values, isCrawling: state });
  };

  const ipcCrawlListener = (event, data) => {
    console.log("From main ipc:", data);
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
            placeholder="请输入头条文章网址 ID, 如: i6717557272035197451"
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
