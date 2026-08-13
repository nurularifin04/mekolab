import C from "./constants.mjs";
import { path2Bitmap } from "./convert.mjs";

//const loadImg = await path2Bitmap('/assets/loading.png');

class Modal {
  constructor(dialogElement) {
    this.dialog = dialogElement;
    this.sprite = {
      src: null,
      x: 0,
      y: 0,
      w: C.TILE * 3,
      h: C.TILE * 2,
      max: 12,
      speed: 250,
    };

    this.queue = [];
    this.isShowing = false;
    this.requestId = null;
    this.startTime = null;

    path2Bitmap("/assets/loading.png").then(
      (bitmap) => (this.sprite.src = bitmap),
    );
  }

  _stopAnimation() {
    if (this.requestId) cancelAnimationFrame(this.requestId);
    this.requestId = null;
    this.startTime = null;
  }

  _loop(timestamp) {
    const cvs = this.dialog.querySelector("canvas");

    if (!cvs) return;
    if (!this.startTime) this.startTime = timestamp;

    const elapsed = timestamp - this.startTime;
    const frameIndex =
      Math.floor(elapsed / this.sprite.speed) % this.sprite.max;
    const sx = (this.sprite.x + (frameIndex % this.sprite.max)) * this.sprite.w;
    const sy =
      (this.sprite.y + Math.floor(frameIndex / this.sprite.max)) *
      this.sprite.h;

    const ctx = cvs.getContext("2d");
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.drawImage(
      this.sprite.src,
      sx,
      sy,
      this.sprite.w,
      this.sprite.h,
      0,
      0,
      cvs.width,
      cvs.height,
    );

    this.requestId = requestAnimationFrame(this._loop.bind(this));
  }

  _showNext() {
    if (this.queue.length === 0) return this.close();

    this._stopAnimation();
    this.isShowing = true;

    const config = this.queue[0];

    this.dialog.innerHTML = `
      <div class="modal-wrapper">
        <div class="modal-text">${config.text}</div>
        <div class="modal-footer">
          ${config.onConfirm ? '<button id="modal-cancel">Cancel</button>' : ""}
          <button id="modal-confirm">Ok</button>
        </div>
      </div>
    `;

    const confirmBtn = this.dialog.querySelector("#modal-confirm");
    const cancelBtn = this.dialog.querySelector("#modal-cancel");

    const handleAction = (shouldConfirm) => {
      if (shouldConfirm && config.onConfirm) config.onConfirm();
      this.queue.shift();
      this._showNext();
    };

    confirmBtn.onclick = () => handleAction(true);
    if (cancelBtn) cancelBtn.onclick = () => handleAction(false);

    if (!this.dialog.open) this.dialog.showModal();
  }

  loading() {
    this._stopAnimation();
    this.isShowing = true;

    this.dialog.innerHTML = `
      <canvas id="loading-canvas" width="${this.sprite.w / 2}" height="${this.sprite.h / 2}"></canvas>
    `;

    if (!this.dialog.open) this.dialog.showModal();
    this.requestId = requestAnimationFrame(this._loop.bind(this));
  }

  alert(config) {
    this.queue.push(config);

    if (!this.isShowing || document.querySelector("#loading-canvas")) {
      this._showNext();
    }
  }

  close() {
    this._stopAnimation();
    this.isShowing = false;
    this.queue = [];
    this.dialog.close();
  }
}

export default Modal;
