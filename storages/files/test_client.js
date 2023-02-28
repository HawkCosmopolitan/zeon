
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

module.exports.test = async () => {

  let data = new FormData();
  data.append("file", file);
  let request = new XMLHttpRequest();
  request.open(
    "POST",
    `http://localhost:4000/file/upload_file?token=${token}&roomId=${props.room_id
    }&extension=${dataUrl.name.lastIndexOf(".") + 1 >= 0
      ? dataUrl.name.substr(
        dataUrl.name.lastIndexOf(".") + 1
      )
      : ""
    }&isPresent=false`
  );
  let f = {
    progress: 0,
    name: file.name,
    size: file.size,
    local: true,
  };
  request.upload.addEventListener("progress", function (e) {
    let percent_completed = (e.loaded * 100) / e.total;
    f.progress = percent_completed;
    if (percent_completed === 100) {
      f.local = false;
    }
    forceUpdate();
  });
  request.onreadystatechange = function () {
    if (request.readyState === XMLHttpRequest.DONE) {
      
      let fileId = JSON.parse(request.responseText).file.id;

      // file uploaded !

    }
  };
  if (FileReader) {
    let fr = new FileReader();

    fr.onload = function () {
      f.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  request.send(data);
};
