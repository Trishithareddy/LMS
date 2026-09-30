export async function uploadHexToArduino(port, hexContent) {
  try {
    const writer = port.writable.getWriter();

    const binary = atob(hexContent);

    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    console.log("HEX BYTES:", bytes);

    // temporary test write
    await writer.write(bytes.slice(0, 64));

    writer.releaseLock();

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}