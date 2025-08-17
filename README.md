### MekoLab: A Mekorama Level Editor

MekoLab is a Mekorama level editor that allows users to quickly modify levels by replacing block types in bulk, without manual editing.

### Key Features

1.  **QR Code Import and Export:**
    * Users can upload a Mekorama level's QR Code image to decode its data.
    * After modification, users can generate and download a new QR Code containing the altered level.

2.  **Level Scanning and Processing:**
    * When an image is uploaded, the application uses the `jsQR` library to scan the code.
    * The binary data from the code is then decompressed using `pako` to retrieve the level data.
    * The level data is then processed to display level information and a list of existing blocks.

3.  **Mass Block Replacement:**
    * MekoLab's primary feature is the ability to mass-replace a specific block type.
    * You can select a block type to change (e.g., all `Stone` blocks) and replace them with another type (e.g., `Metal`).
    * You can also select other attributes like orientation or font texture, which will be applied to all selected blocks.

### About Data and Assets

* **Reverse Engineering Logic:** This website is built upon the research and reverse engineering efforts of the Mekorama community. The data structure is documented in forums like the [Mekorama Forum](https://mekoramaforum.com/threads/qr-code-can-it-be-reverse-engineered.257/). MekoLab leverages this understanding to read and modify level data.

* **Block Naming:** The block names used in this editor are partially based on the official Mekorama names. However, names for unreleased/unnamed blocks are an internal naming convention created based on research.

* **Visual Assets:** The images used to represent the blocks in this editor are non-official assets that were taken and cropped from Mekorama level cards. **The copyright for these assets remains entirely with the original creator of the Mekorama game, Martin Magni.**

### Usage Warning

Please use this editor with caution, especially when dealing with unreleased or experimental block types. Such blocks may have **unstable behavior** or could potentially cause the Mekorama application to **crash or unexpectedly close**.

**Specific Caution for Wheel Blocks:**
If you place a `Wheel` block, it *must* be attached to a movable block (e.g., a `Slider`, or `Motor`). Failure to attach a `Wheel` block to a movable base will likely result in the Mekorama application encountering an error or crashing.

### Third-Party Libraries Notice

This website uses several third-party libraries for specific functionalities. We want to provide proper attribution and link to their original sources. The license of each respective library applies to its usage.

---

### List of Libraries

1.  **jsQR** - v1.4.0
    * Description: Used for scanning QR codes.
    * License: [https://github.com/cozmo/jsQR/blob/master/LICENSE](https://github.com/cozmo/jsQR/blob/master/LICENSE)

2.  **pako** - v2.1.0
    * Description: Used for data compression and decompression.
    * License: [https://github.com/nodeca/pako/blob/master/LICENSE](https://github.com/nodeca/pako/blob/master/LICENSE)

3.  **qrcode-generator** - v2.0.2
    * Description: Used for generating QR codes.
    * License: [https://github.com/kazuhikoarase/qrcode-generator/blob/master/LICENSE](https://github.com/kazuhikoarase/qrcode-generator/blob/master/LICENSE)

4.  **SweetAlert2** - v11.22.4
    * Description: Used to display beautiful, custom pop-up notifications and dialogs.
    * License: [https://github.com/sweetalert2/sweetalert2/blob/main/LICENSE](https://github.com/sweetalert2/sweetalert2/blob/main/LICENSE)

---