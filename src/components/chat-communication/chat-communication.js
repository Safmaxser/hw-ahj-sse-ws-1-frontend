import "./chat-communication.css";
import TransferService from "./transfer-service";
import User from "./user";

function dateNowToStr() {
  const date = new Date();
  const strTime = date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const strDate = date.toLocaleDateString("ru-RU");
  return strTime + " " + strDate;
}

export default class ChatCommunication {
  constructor(container, urlBase) {
    this.container = this.bindToDOM(container);
    this.urlBase = urlBase;
    this.transferService = new TransferService(`https://${this.urlBase}`);
    this.ws;
    this.users = [];
    this.myUser = {};
    this.popupForm;
    this.inputName;
    this.notice;
    this.chatCommunication;
    this.usersList;
    this.messagesControl;
    this.messageInput;
    this.messagesList;
    this.init();
  }

  init() {
    this.createBaseDom();
    this.createPopupDom();
    this.showPopup();
    this.eventInit();
  }

  bindToDOM(container) {
    if (!(container instanceof HTMLElement)) {
      throw new Error("Container is not HTMLElement!");
    }
    return container;
  }

  eventInit() {
    this.popupForm.addEventListener(
      "submit",
      this.onSubmitPopupForm.bind(this),
    );
    this.messagesControl.addEventListener(
      "submit",
      this.onSubmitMessagesControl.bind(this),
    );
  }

  initWS() {
    this.ws = new WebSocket(`wss://${this.urlBase}/ws`);
    this.eventWS();
  }

  eventWS() {
    this.ws.addEventListener("open", this.onOpenWS.bind(this));
    this.ws.addEventListener("close", this.onCloseWS.bind(this));
    this.ws.addEventListener("error", this.onErrorWS.bind(this));
    this.ws.addEventListener("message", this.onMessageWS.bind(this));
    window.addEventListener("beforeunload", this.onBeforeunload.bind(this));
  }

  onOpenWS() {
    console.info("WS Open");
  }

  onCloseWS() {
    console.info("WS Close");
  }

  onErrorWS() {
    console.error("WS Error");
  }

  onMessageWS(event) {
    const dataJson = JSON.parse(event.data);
    if (dataJson.type) {
      if (dataJson.type === "send") {
        this.createMessage(dataJson);
      }
    } else {
      this.usersList.innerHTML = "";
      this.users = [];
      for (const user of dataJson) {
        this.createUser(user);
      }
    }
  }

  onBeforeunload() {
    this.ws.send(
      JSON.stringify({
        type: "exit",
        user: this.myUser,
      }),
    );
  }

  createMessage(dataJson) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    let title = dataJson.user.name + ", " + dataJson.created;
    if (this.myUser.id === dataJson.user.id) {
      messageElement.classList.add("my-message");
      title = "You, " + dataJson.created;
    }
    messageElement.insertAdjacentHTML(
      "beforeend",
      `
      <div class="message-headline">
        <div class="message-avatar" style="background-color: #${dataJson.user.id.split("-")[0]}"></div>
        <div class="message-title">
          ${title}
        </div>
      </div>
      <div class="message-text">
        ${dataJson.message}
      </div>  
      `,
    );
    this.messagesList.appendChild(messageElement);
    messageElement.scrollIntoView();
  }

  createUser(user) {
    let styleUser = "user";
    let nameUser = user.name;
    if (this.myUser.id === user.id) {
      styleUser += " my-user";
      nameUser = "You";
    }
    this.usersList.insertAdjacentHTML(
      "beforeend",
      `
      <div class="${styleUser}" data-id="${user.id}">
        <div class="user-avatar" style="background-color: #${user.id.split("-")[0]}"></div>
        <div class="user-name">
          ${nameUser}
        </div>
      </div>
      `,
    );
    this.users.push(new User(user));
  }

  onSubmitMessagesControl(event) {
    event.preventDefault();
    const text = this.messageInput.value.trim();
    if (text) {
      this.ws.send(
        JSON.stringify({
          type: "send",
          user: this.myUser,
          message: text,
          created: dateNowToStr(),
        }),
      );
      this.messageInput.value = "";
    }
  }

  onSubmitPopupForm(event) {
    event.preventDefault();
    this.transferService.newUser(
      this.inputName.value,
      this.processNewUser.bind(this),
    );
  }

  processNewUser(data) {
    if (data.status >= 200 && data.status <= 299) {
      if (data.jsonData.status === "ok") {
        this.inputName.value = "";
        this.newUser(data.jsonData.user);
        this.initWS();
        return;
      }
    }
    if (data.status >= 400 && data.status <= 499) {
      if (data.jsonData.status === "error") {
        this.showNotice(data.jsonData.message);
        return;
      }
    }
    this.showNotice("Unknown error! Please try again!");
  }

  newUser(user) {
    if (user) {
      this.myUser = new User(user);
      this.removePopup();
    }
  }

  showNotice(text) {
    this.notice.textContent = text;
    setTimeout(() => {
      this.notice.textContent = "";
    }, 2000);
  }

  showPopup() {
    this.container.appendChild(this.popup);
  }

  removePopup() {
    this.popup.remove();
  }

  createPopupDom() {
    this.popup = document.createElement("div");
    this.popup.classList.add("popup");
    this.popup.insertAdjacentHTML(
      "beforeend",
      `
      <form class="popup-form">
        <h2 class="popup-title">Choose a nickname</h2>
        <input class="input-name" name="name" type="text" required>
        <span class="notice"></span>
        <button class="btn-submit" type="submit">Continue</button>              
      </form>
      `,
    );
    this.popupForm = this.popup.querySelector(".popup-form");
    this.inputName = this.popup.querySelector(".input-name");
    this.notice = this.popup.querySelector(".notice");
  }

  createBaseDom() {
    this.container.insertAdjacentHTML(
      "beforeend",
      `
      <div class="chat-communication">
        <div class="users-block">
          <div class="users-list">
          </div>      
        </div>
        <div class="messages-block">
          <div class="messages-list">        
          </div>
          <form class="messages-control">
            <input class="message-input" type="text" placeholder="Type your message here">
          </form>
        </div>
      </div>  
      `,
    );
    this.chatCommunication = this.container.querySelector(
      ".chat-communication",
    );
    this.usersList = this.chatCommunication.querySelector(".users-list");
    this.messagesControl =
      this.chatCommunication.querySelector(".messages-control");
    this.messageInput = this.chatCommunication.querySelector(".message-input");
    this.messagesList = this.chatCommunication.querySelector(".messages-list");
  }
}
