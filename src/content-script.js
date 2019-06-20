function init() {
  const keygens = [...document.querySelectorAll("keygen")];
  fixupKeygenNodes(keygens);
  // I don't think we can distinguish createElement("keygen") vs innerHTML, the firefox implementation didn't support createElement
  observe();
}

async function sendMessage(type, data = {}) {
  return browser.runtime.sendMessage({
    type,
    data,
  });
}

// Reimplementing https://phabricator.services.mozilla.com/D22810
// Generate with web crypto in the content script and the background script will integration into NSS

function fixupKeygenNodes(keygens) {
  for (let keygen of keygens) {
    if (!keygen.dataset.retrofitted) {
      let select = document.createElement("select");
      select.innerHTML = "<option>High Grade</option><option>Medium Grade</option>";
      // Copy the keygen element attributes into the select.
      for (let attribute of keygen.attributes) {
        select.setAttribute(attribute.name, attribute.value);
      }
      // Add form handler that can save the certs
      processClosestForm(keygen.closest("form"));
      keygen.insertAdjacentElement("afterend", select);
      keygen.dataset.retrofitted = true;
      // TODO Add the value to the option elements via web crypto
    }
  }
}

function processClosestForm(form) {
  if (!form.dataset.retrofitted) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      // TODO store all the generated certs
      console.log("submit", e);
      const cert = "my cert"; // TODO add this from the keygen element
      let res = await sendMessage("addCert", {cert});
      console.log("nss response", res);

      // TODO add the field to the form?
      
      // Submit the form without the handlers
      e.target.submit();
    });
    form.dataset.retrofitted = true;
  }
}

function observe() {
  // Options for the observer (which mutations to observe)
  const config = { childList: true, subtree: true };
  
  // Callback function to execute when mutations are observed
  const callback = function(mutationsList, observer) {
      for(var mutation of mutationsList) {
          if (mutation.type == 'childList') {
              console.log('A child node has been added or removed.', mutation);
              let keygens = [...mutation.addedNodes].filter((a) => {
                if (a.tagName === "KEYGEN") {
                  return true;
                }
              });
              if (keygens.length) {
                fixupKeygenNodes(keygens);
              }
          }
      }
  };
  const observer = new MutationObserver(callback);
  
  observer.observe(document.body, config);
}

init();
