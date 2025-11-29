import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

function FrogCursorApp() {
  React.useEffect(() => {
    const cursorEl = document.createElement("div");
    cursorEl.className = "frog-cursor";
    document.body.appendChild(cursorEl);

    function handleMove(e) {
      cursorEl.style.left = `${e.clientX}px`;
      cursorEl.style.top = `${e.clientY}px`;
    }

    window.addEventListener("pointermove", handleMove);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.body.removeChild(cursorEl);
    };
  }, []);

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <FrogCursorApp />
);
