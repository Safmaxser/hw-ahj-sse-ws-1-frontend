import createRequest from "./api/create-request";

export default class TransferService {
  constructor(urlBase) {
    this.urlBase = urlBase;
  }

  newUser(name, callback) {
    createRequest({
      url: this.urlBase + "/new-user",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    }).then((response) => {
      callback(response);
    });
  }
}
