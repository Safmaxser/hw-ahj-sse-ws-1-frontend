import ChatCommunication from "../components/chat-communication/chat-communication";

document.addEventListener("DOMContentLoaded", () => {
  new ChatCommunication(
    document.documentElement.children[1],
    "hw-ahj-sse-ws-1-backend.onrender.com",
  );
});
