import Modal from "./modal.mjs";
import { state } from "./state.mjs";
import { loadImageFile } from "./file-loader.mjs";
import { Decode, Render } from "./processor.ml2.mjs";
import { mekoBlocks } from "./blocks.ml2.mjs";

const modal = new Modal(document.querySelector(".ml2-modal"));

const mainPage = document.querySelector(".main-page");
const cardCollector = document.querySelector(".card-collector");
const imageInput = document.querySelector("#image-input");
const addBtn = document.querySelector(".add-card");

const mainToolbar = document.querySelector(".main-toolbar");
const deleteBtn = document.querySelector("#delete-card");
const playBtn = document.querySelector("#play-online");
const buildBtn = document.querySelector("#level-editor");
const shareBtn = document.querySelector("#share-card");

export const initMain = () => {
  const cvs = document.querySelector("#cvs");
  cvs.width = 18 * 64;
  cvs.height = 18 * 64;
  const ctx = cvs.getContext("2d");

  const handleMainToolbar = () => {
    const count = state.cards.length;
    if (count > 1) {
      playBtn.disabled = true;
      shareBtn.disabled = true;
    } else if (count === 1) {
      playBtn.disabled = false;
      shareBtn.disabled = false;
      mainToolbar.classList.add("open");
    } else {
      mainToolbar.classList.remove("open");
    }
  };

  mainPage.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    const isControlElement = [
      "button",
      "dialog",
      'input[type="file"]',
      "select",
      ".main-toolbar",
    ].some((selector) => e.target.closest(selector));

    if (card) {
      const index = state.cards.indexOf(card);
      card.classList.toggle("active");
      if (card.classList.contains("active")) {
        state.cards.push(card);
      } else {
        state.cards.splice(index, 1);
      }
    } else if (!isControlElement) {
      state.resetCards();
    }

    handleMainToolbar();
  });

  imageInput.addEventListener("change", async (event) => {
    const files = event.target.files;

    if (files.length > 0) {
      const imgs = await Promise.all(Array.from(files).map(loadImageFile));
      cardCollector.append(...imgs);

      requestAnimationFrame(() => {
        addBtn.scrollIntoView();
      });
    }

    event.target.value = "";
  });

  //addBtn.onclick = () => imageInput.click();

  deleteBtn.addEventListener("click", () => {
    let count = state.cards.length;
    let message = count !== 1 ? `Remove ${count} cards?` : "Remove this card?";

    modal.alert({
      text: message,
      onConfirm: () => {
        state.cards.forEach((card) => card.remove());
        state.cards.length = 0;
        handleMainToolbar();
      },
    });
  });

  playBtn.addEventListener("click", async () => {
    modal.loading();
    try {
      const level = await Decode.create(state.cards[0]);
      const base64 = btoa(String.fromCharCode(...level.binary));
      const link = document.createElement("a");
      link.href = `/play/?l=${encodeURIComponent(base64)}`;
      link.target = "_blank";
      link.click();
      link.remove();
      modal.close();
    } catch (error) {
      modal.alert({ text: error.message });
    }
  });

  buildBtn.addEventListener("click", async () => {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    modal.loading();
    state.resetLevel();
    const editPage = document.querySelector(".edit-page");

    try {
      for (let c = 0; c < state.cards.length; c += 1) {
        const level = await Decode.create(state.cards[c]);

        if (c === 0) {
          state.title = level.title;
          state.author = level.author;
        } else if (state.author !== level.author) {
          modal.alert({ text: "Author name not match." });
          return;
        }

        for (let i = 0; i < level.blocks.length; i += 3) {
          if (level.blocks[i] === 0) continue;
          state.blocks[i] = level.blocks[i];
          state.blocks[i + 1] = level.blocks[i + 1];
          state.blocks[i + 2] = level.blocks[i + 2];
        }
      }

      Render.drawAll(ctx, state.blocks);

      editPage.classList.add("open");
      state.resetCards();
      handleMainToolbar();
      modal.close();
    } catch (err) {
      popupLog(err);
    }
  });

  shareBtn.addEventListener("click", async () => {});

  function popupLog(error) {
    const isDev =
      location.hostname === "localhost" || location.hostname === "127.0.0.1";

    if (isDev) {
      catchLog(error);
      modal.close();
    } else {
      modal.alert({ text: error.message });
    }
  }
};
