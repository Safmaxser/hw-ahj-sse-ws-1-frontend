const createRequest = async (options = {}) => {
  const response = await fetch(options.url, {
    method: options.method,
    headers: options.headers,
    body: options.body,
  });
  let jsonData;
  let error;
  try {
    jsonData = await response.json();
  } catch {
    error = Error("Response is not JSON!");
  }
  return {
    status: response.status,
    jsonData,
    error,
  };
};

export default createRequest;
