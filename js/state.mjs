import C from "./constants.mjs";

export const state = {
  cards: [],
  title: "New Level",
  author: "Unknown Author",
  blocks: new Uint8Array(3 * C.D3),
  value: new Uint8Array(3).fill(0),
  resetCards() {
    this.cards.forEach((card) => card.classList.remove("active"));
    this.cards.length = 0;
  },
  resetLevel() {
    this.blocks.fill(0);
    this.title = "New Level";
    this.author = "Unknown Author";
  },
  resetAll() {
    this.resetCards();
    this.resetLevel();
    this.value.fill(0);
  },
  replace(idx) {
    this.blocks[idx] = this.value[0];
    this.blocks[idx + 1] = this.value[1];
    this.blocks[idx + 2] = this.value[2];
  },
};
