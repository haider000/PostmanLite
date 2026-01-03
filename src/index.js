const sendRequestBtn = document.querySelector("#sendRequest");
const requestMethodInput = document.querySelector("#requestMethod");
const requestUrlInput = document.querySelector("#requestUrl");
const queryParametersList = document.querySelector("#queryParametersList");
const addQueryParametersBtn = document.querySelector("#addQueryParameters");
const responseTextArea = document.querySelector("#responseText");
const responseStatusArea = document.querySelector("#responseStatus");
const responseSizeArea = document.querySelector("#responseSize");
const responseTimeArea = document.querySelector("#responseTime");
const responseContainer = document.querySelector(".response-container");
const requestAuthInput = document.querySelector("#requestAuth");
const basicAuthUsernameInput = document.querySelector("#basicAuthUsername");
const basicAuthPasswordInput = document.querySelector("#basicAuthPassword");
const bearerTokenInput = document.querySelector("#bearerToken");
const headersList = document.querySelector("#headersList");
const addHeadersBtn = document.querySelector("#addHeaders");
const requestBodyTypeInput = document.querySelector("#requestBodyType");

const getAuth = () => {
  if (requestAuthInput.value === "basic-auth") {
    const username = basicAuthUsernameInput.value.trim();
    const password = basicAuthPasswordInput.value.trim();
    if (username && password) {
      return "Basic " + btoa(username + ":" + password);
    }
  } else if (requestAuthInput.value === "bearer-token") {
    const token = bearerTokenInput.value.trim().replace(/^Bearer\s+/i, "");
    if (token) {
      return "Bearer " + token;
    }
  }
  return null;
};

const getParams = () => {
  let queryParameters = {};
  queryParametersList.querySelectorAll("li").forEach((elem) => {
    const inputs = elem.querySelectorAll("input");
    if (inputs.length === 0) return;
    if (!inputs[0].checked) return;
    const key = inputs[1].value.trim();
    const value = inputs[2].value.trim();
    if (key) {
      queryParameters[key] = value;
    }
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
  } else if (selectedValue === "application-xml") {
    return "application/xml";
  }
  return null;
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
    const key = inputs[1].value.trim();
    const value = inputs[2].value.trim();
    if (key) {
      headers[key] = value;
    }
  });
  return headers;
};

const formatResponse = (text) => {
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return text;
  }
};

const detectLanguage = (text) => {
  // Try to detect if it's JSON
  try {
    JSON.parse(text);
    return "json";
  } catch (e) {
    // Check if it looks like XML
    if (text.trim().startsWith("<") && text.trim().endsWith(">")) {
      return "xml";
    }
    // Check if it looks like HTML
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      return "html";
    }
    // Default to plain text
    return "plaintext";
  }
};

// Validation functions
const validateUrl = (url) => {
  if (!url || !url.trim()) {
    return { valid: false, message: "Please enter a URL" };
  }
  
  const trimmedUrl = url.trim();
  
  // Check if URL starts with http:// or https://
  if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
    return { valid: false, message: "URL must start with http:// or https://" };
  }
  
  // Try to validate with URL constructor
  try {
    const urlObj = new URL(trimmedUrl);
    // Additional check for valid hostname
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      return { valid: false, message: "Please enter a valid URL with a hostname" };
    }
    return { valid: true };
  } catch (e) {
    // If URL constructor fails, try a more lenient check
    // Check for basic URL pattern: protocol://domain/path
    const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    if (urlPattern.test(trimmedUrl)) {
      return { valid: true };
    }
    return { valid: false, message: "Please enter a valid URL (e.g., https://jsonplaceholder.typicode.com/todos)" };
  }
};

const validateBearerToken = (token) => {
  if (!token || !token.trim()) {
    return { valid: false, message: "Bearer token cannot be empty" };
  }
  // Remove "Bearer " prefix if user added it
  const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
  if (!cleanToken) {
    return { valid: false, message: "Bearer token cannot be empty" };
  }
  return { valid: true, token: cleanToken };
};

const validateBasicAuth = (username, password) => {
  if (!username || !username.trim()) {
    return { valid: false, message: "Username is required for Basic Auth" };
  }
  if (!password || !password.trim()) {
    return { valid: false, message: "Password is required for Basic Auth" };
  }
  return { valid: true };
};

const validateJsonBody = (body) => {
  if (!body || !body.trim()) {
    return { valid: true }; // Empty body is valid
  }
  try {
    JSON.parse(body);
    return { valid: true };
  } catch (e) {
    return { valid: false, message: "Invalid JSON format. Please check your JSON syntax." };
  }
};

const validateXmlBody = (body) => {
  if (!body || !body.trim()) {
    return { valid: true }; // Empty body is valid
  }
  // Basic XML validation
  const trimmed = body.trim();
  if (!trimmed.startsWith("<") || !trimmed.endsWith(">")) {
    return { valid: false, message: "Invalid XML format. XML must start with < and end with >" };
  }
  // Check for basic XML structure
  const openTags = (trimmed.match(/</g) || []).length;
  const closeTags = (trimmed.match(/>/g) || []).length;
  if (openTags !== closeTags) {
    return { valid: false, message: "Invalid XML format. Mismatched tags detected." };
  }
  return { valid: true };
};

const handleSend = async () => {
  sendRequestBtn.setAttribute("disabled", true);
  
  // Get and trim URL
  const url = requestUrlInput.value ? requestUrlInput.value.trim() : "";
  const method = requestMethodInput.value;
  const params = getParams();
  const headers = getHeaders();
  const body = getBody();
  
  // Validate URL
  const urlValidation = validateUrl(url);
  if (!urlValidation.valid) {
    alert(urlValidation.message);
    sendRequestBtn.removeAttribute("disabled");
    requestUrlInput.focus();
    return;
  }
  
  // Use the validated and trimmed URL
  const finalUrl = url;
  
  // Validate Bearer Token if selected
  if (requestAuthInput.value === "bearer-token") {
    const tokenValidation = validateBearerToken(bearerTokenInput.value);
    if (!tokenValidation.valid) {
      alert(tokenValidation.message);
      sendRequestBtn.removeAttribute("disabled");
      bearerTokenInput.focus();
      return;
    }
    // Update token if it had "Bearer " prefix
    if (tokenValidation.token !== bearerTokenInput.value) {
      bearerTokenInput.value = tokenValidation.token;
    }
  }
  
  // Validate Basic Auth if selected
  if (requestAuthInput.value === "basic-auth") {
    const authValidation = validateBasicAuth(
      basicAuthUsernameInput.value,
      basicAuthPasswordInput.value
    );
    if (!authValidation.valid) {
      alert(authValidation.message);
      sendRequestBtn.removeAttribute("disabled");
      if (!basicAuthUsernameInput.value.trim()) {
        basicAuthUsernameInput.focus();
      } else {
        basicAuthPasswordInput.focus();
      }
      return;
    }
  }
  
  // Validate JSON body if selected
  if (requestBodyTypeInput.value === "application-json") {
    const jsonBody = document.querySelector("#application-json-data").value;
    const jsonValidation = validateJsonBody(jsonBody);
    if (!jsonValidation.valid) {
      alert(jsonValidation.message);
      sendRequestBtn.removeAttribute("disabled");
      document.querySelector("#application-json-data").focus();
      return;
    }
  }
  
  // Validate XML body if selected
  if (requestBodyTypeInput.value === "application-xml") {
    const xmlBody = document.querySelector("#application-xml-data").value;
    const xmlValidation = validateXmlBody(xmlBody);
    if (!xmlValidation.valid) {
      alert(xmlValidation.message);
      sendRequestBtn.removeAttribute("disabled");
      document.querySelector("#application-xml-data").focus();
      return;
    }
  }
  
  console.log("Sending request", { method, url: finalUrl, params, headers, body });
  const startTime = Date.now();
  
  try {
    // Construct URL with query parameters
    let requestUrl = finalUrl;
    if (params) {
      requestUrl += (finalUrl.includes("?") ? "&" : "?") + params;
    }
    
    const result = await fetch(requestUrl, { method, headers, body });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const readableResponseTime = responseTime + "ms";
    
    console.log("result", result);
    const response = await result.text();
    
    const formattedResponse = formatResponse(response);
    
    // Remove empty state class
    if (responseContainer) {
      responseContainer.classList.remove("empty-state");
    }
    
    // Detect language for syntax highlighting
    const language = detectLanguage(response);
    
    // Set the content and language class
    responseTextArea.textContent = formattedResponse;
    responseTextArea.className = `language-${language}`;
    
    // Re-highlight code if highlight.js is available
    // Use setTimeout to ensure DOM is updated before highlighting
    setTimeout(() => {
      if (typeof hljs !== "undefined") {
        try {
          hljs.highlightElement(responseTextArea);
        } catch (e) {
          console.error("Highlight.js error:", e);
        }
      }
    }, 10);
    
    // Update status with color coding
    const statusCode = result.status;
    const statusText = result.statusText;
    responseStatusArea.textContent = statusCode + " " + statusText;
    responseStatusArea.className = statusCode >= 200 && statusCode < 300 ? "status-badge status-success" : 
                                   statusCode >= 400 ? "status-badge status-error" : "";
    
    // Format size
    const contentLength = result.headers.get("Content-Length");
    const size = contentLength ? parseInt(contentLength) : response.length;
    const formattedSize = size < 1024 ? size + " B" : 
                         size < 1024 * 1024 ? (size / 1024).toFixed(2) + " KB" : 
                         (size / (1024 * 1024)).toFixed(2) + " MB";
    responseSizeArea.textContent = formattedSize;
    responseTimeArea.textContent = readableResponseTime;
    sendRequestBtn.removeAttribute("disabled");
  } catch (e) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const readableResponseTime = responseTime + "ms";
    
    responseTextArea.textContent = "Error: " + e.message;
    
    // Remove empty state class
    if (responseContainer) {
      responseContainer.classList.remove("empty-state");
    }
    
    responseStatusArea.textContent = "Error";
    responseStatusArea.className = "status-badge status-error";
    responseSizeArea.textContent = "0 B";
    responseTimeArea.textContent = readableResponseTime;
    sendRequestBtn.removeAttribute("disabled");
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

// Initialize visibility on page load
const initializeVisibility = () => {
  // Initialize auth visibility
  const authValue = requestAuthInput.value;
  document.querySelectorAll(".auth-methods").forEach((elem) => {
    if (elem.id === authValue) {
      elem.classList.remove("visually-hidden");
    } else {
      elem.classList.add("visually-hidden");
    }
  });
  
  // Initialize body type visibility
  const bodyValue = requestBodyTypeInput.value;
  document.querySelectorAll(".body-types").forEach((elem) => {
    if (elem.id === bodyValue) {
      elem.classList.remove("visually-hidden");
    } else {
      elem.classList.add("visually-hidden");
    }
  });
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

// Initialize on page load
// Bootstrap 5 tabs work automatically with data-bs-toggle="tab" attributes
// Since Bootstrap JS is loaded before this script, tabs should work automatically
const initialize = () => {
  initializeVisibility();
  // Set initial empty state for response container
  if (responseContainer && !responseTextArea.textContent.trim()) {
    responseContainer.classList.add("empty-state");
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
