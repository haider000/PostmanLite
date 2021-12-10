const sendRequestBtn = document.querySelector("#sendRequest");
const requestMethodInput = document.querySelector("#requestMethod");
const requestUrlInput = document.querySelector("#requestUrl");
const queryParametersList = document.querySelector("#queryParametersList");
const addQueryParametersBtn = document.querySelector("#addQueryParameters");
const responseTextArea = document.querySelector("#responseText");
const responseStatusArea = document.querySelector("#responseStatus");
const responseSizeArea = document.querySelector("#responseSize");
const responseTimeArea = document.querySelector("#responseTime");
const requestAuthInput = document.querySelector("#requestAuth");
const basicAuthUsernameInput = document.querySelector("#basicAuthUsername");
const basicAuthPasswordInput = document.querySelector("#basicAuthPassword");
const bearerTokenInput = document.querySelector("#bearerToken");
const headersList = document.querySelector("#headersList");
const addHeadersBtn = document.querySelector("#addHeaders");
const requestBodyTypeInput = document.querySelector("#requestBodyType");

const getAuth = () => {
  if (requestAuthInput.value === "basic-auth") {
    const username = basicAuthUsernameInput.value;
    const password = basicAuthPasswordInput.value;
    return "Basic " + new Buffer(username + ":" + password).toString("base64");
  } else if (requestAuthInput.value === "bearer-token") {
    return "Bearer " + bearerTokenInput.value;
  }
};

const getParams = () => {
  let queryParameters = {};
  queryParametersList.querySelectorAll("li").forEach((elem) => {
    const inputs = elem.querySelectorAll("input");
    if (inputs.length === 0) return;
    if (!inputs[0].checked) return;
    const key = inputs[1].value;
    const value = inputs[2].value;
    queryParameters[key] = value;
  });
  const urlSearchParams = new URLSearchParams(queryParameters);
  return urlSearchParams.toString();
};

const getContentType = () => {
  const selectedValue = requestBodyTypeInput.value;
  if (selectedValue === "application-json") {
    return "application/json";
  } else if (selectedValue === "text-plain") {
    return "text/plain";
  } else if ("application-xml") {
    return "application/xml";
  }
};

const getBody = () => {
  const selectedValue = requestBodyTypeInput.value;
  if (selectedValue === "none") {
    return null;
  } else {
    const id = selectedValue + "-data";
    return document.querySelector(`#${id}`).value;
  }
};

const getHeaders = () => {
  let headers = {};
  const authorization = getAuth();
  if (authorization) {
    headers["Authorization"] = authorization;
  }
  const contentType = getContentType();
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  headersList.querySelectorAll("li").forEach((elem) => {
    const inputs = elem.querySelectorAll("input");
    if (inputs.length === 0) return;
    if (!inputs[0].checked) return;
    const key = inputs[1].value;
    const value = inputs[2].value;
    headers[key] = value;
  });
  return headers;
};

const handleSend = async () => {
  sendRequestBtn.setAttribute("disabled", true);
  const url = requestUrlInput.value;
  const method = requestMethodInput.value;
  const params = getParams();
  const headers = getHeaders();
  const body = getBody();
  console.log("Sending request", { method, url, params, headers, body });
  const startTime = Date.now();
  try {
    const result = await fetch(url + "?" + params, { method, headers, body });
    const endTime = Date.now();
    const responseTime = new Date(endTime - startTime);
    const redableResponseTime =
      responseTime.getSeconds() * 1000 + responseTime.getMilliseconds() + "ms";
    const response = await result.text();
    responseTextArea.innerText = Json(response);
    responseStatusArea.innerText = result.status;
    responseSizeArea.innerText =
      result.headers.get("Content-Length") || response.length;
    responseTimeArea.innerText = redableResponseTime;
    sendRequestBtn.removeAttribute("disabled");
  } catch (e) {
    const endTime = Date.now();
    const responseTime = new Date(endTime - startTime);
    const redableResponseTime =
      responseTime.getSeconds() * 1000 + responseTime.getMilliseconds() + "ms";
    responseTextArea.innerText = e.message;
    responseStatusArea.innerText = "";
    responseTimeArea.innerText = redableResponseTime;
  }
};

const queryParameterTemplate = `
  <input class="me-2" style="height: 38px; width: 38px;" type="checkbox">
  <input class="form-control me-1" type="text" placeholder="key">
  <input class="form-control ms-1" type="text" placeholder="value">
`;

const headerTemplate = `
  <input class="me-2" style="height: 38px; width: 38px;" type="checkbox">
  <input class="form-control me-1" type="text" placeholder="parameter">
  <input class="form-control ms-1" type="text" placeholder="value">
`;

const handleAddQueryParameters = () => {
  const listElement = document.createElement("li");
  listElement.className = "list-group-item d-flex";
  listElement.innerHTML = queryParameterTemplate;
  queryParametersList.prepend(listElement);
};

const handleAddHeaders = () => {
  const listElement = document.createElement("li");
  listElement.className = "list-group-item d-flex";
  listElement.innerHTML = headerTemplate;
  headersList.prepend(listElement);
};

addQueryParametersBtn.addEventListener("click", handleAddQueryParameters);
addHeadersBtn.addEventListener("click", handleAddHeaders);
sendRequestBtn.addEventListener("click", handleSend);
requestAuthInput.addEventListener("change", () => {
  const newValue = requestAuthInput.value;
  document.querySelectorAll(".auth-methods").forEach((elem) => {
    if (elem.id === newValue) {
      elem.classList.remove("visually-hidden");
    } else {
      elem.classList.add("visually-hidden");
    }
  });
});
requestBodyTypeInput.addEventListener("change", () => {
  const newValue = requestBodyTypeInput.value;
  document.querySelectorAll(".body-types").forEach((elem) => {
    if (elem.id === newValue) {
      elem.classList.remove("visually-hidden");
    } else {
      elem.classList.add("visually-hidden");
    }
  });
});
