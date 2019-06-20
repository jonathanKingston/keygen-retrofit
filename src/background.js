async function init() {

  async function messageHandler(message, sender, response) {
    switch (message.type) {
      case "addCert":
        return browser.experiments.nss.addCert(message.data.cert);
        break;
    }
    // dunno what this message is for
    return null;
  }


  browser.runtime.onMessage.addListener(messageHandler);
}

init();
