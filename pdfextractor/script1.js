const dropArea = document.querySelector(".drop-section");
const listSection = document.querySelector(".list-section");
const listContainer = document.querySelector(".list");
const fileSelector = document.querySelector(".file-selector");
const fileSelectorInput = document.querySelector(".file-selector-input");

// Array to store the extracted text for each file
const extractedTexts = [];
const storedPDFsKey = "storedPDFs";

// upload files with browse button
fileSelector.onclick = () => fileSelectorInput.click();
fileSelectorInput.onchange = () => {
  [...fileSelectorInput.files].forEach((file) => {
    if (typeValidation(file.type)) {
      uploadFile(file);
    }
  });
};

// when file is over the drag area
dropArea.ondragover = (e) => {
  e.preventDefault();
  [...e.dataTransfer.items].forEach((item) => {
    if (typeValidation(item.type)) {
      dropArea.classList.add("drag-over-effect");
    }
  });
};

// when file leave the drag area
dropArea.ondragleave = () => {
  dropArea.classList.remove("drag-over-effect");
};

// when file drop on the drag area
dropArea.ondrop = (e) => {
  e.preventDefault();
  dropArea.classList.remove("drag-over-effect");
  if (e.dataTransfer.items) {
    [...e.dataTransfer.items].forEach((item) => {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (typeValidation(file.type)) {
          uploadFile(file);
        }
      }
    });
  } else {
    [...e.dataTransfer.files].forEach((file) => {
      if (typeValidation(file.type)) {
        uploadFile(file);
      }
    });
  }
};

// check the file type
function typeValidation(type) {
  var splitType = type.split("/")[0];
  if (type == "application/pdf") {
    return true;
  }
  // Add more validation logic for other file types if needed
}

// Function to handle file extraction and preprocessing using a worker thread
function handleFile(file) {
  // Create a new worker thread
  const worker = new Worker("pdfWorker.js");

  // Listen for messages from the worker thread
  worker.addEventListener("message", (event) => {
    const { extractedText, error } = event.data;
    if (extractedText) {
      // Preprocess the extracted text
      const preprocessedText = preprocessText(extractedText);

      // Store the preprocessed text for this file
      extractedTexts.push(preprocessedText);

      // Display the preprocessed text for all files
      displayExtractedTexts();

      // Store the extracted texts in local storage
      storeExtractedTexts();
    } else if (error) {
      console.error("Error extracting text:", error);
    }

    // Terminate the worker thread if all files have been processed
    if (extractedTexts.length === fileSelectorInput.files.length) {
      worker.terminate();
    }
  });

  // Start the worker thread by sending the file data
  worker.postMessage({ fileData: file });
}

// upload file function
function uploadFile(file) {
  listSection.style.display = "block";
  var li = document.createElement("li");
  li.classList.add("in-prog");
  li.innerHTML = `
        <div class="col">
            <img src="/assets/images/${iconSelector(file.type)}" alt="">
        </div>
        <div class="col">
            <div class="file-name">
                <div class="name">${file.name}</div>
                <span>0%</span>
            </div>
            <div class="file-progress">
                <span></span>
            </div>
            <div class="file-size">${(file.size / (1024 * 1024)).toFixed(
              2
            )} MB</div>
        </div>
        <div class="col">
            <svg xmlns="http://www.w3.org/2000/svg" class="cross" height="20" width="20"><path d="m5.979 14.917-.854-.896 4-4.021-4-4.062.854-.896 4.042 4.062 4-4.062.854.896-4 4.062 4 4.021-.854.896-4-4.063Z"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" class="tick" height="20" width="20"><path d="m8.229 14.438-3.896-3.917 1.438-1.438 2.458 2.459 6-6L15.667 7Z"/></svg>
        </div>
    `;
  listContainer.prepend(li);
  var http = new XMLHttpRequest();
  var data = new FormData();
  data.append("file", file);
  http.onload = () => {
    li.classList.add("complete");
    li.classList.remove("in-prog");
  };
  http.upload.onprogress = (e) => {
    var percent_complete = (e.loaded / e.total) * 100;
    li.querySelectorAll("span")[0].innerHTML =
      Math.round(percent_complete) + "%";
    li.querySelectorAll("span")[1].style.width = percent_complete + "%";
  };
  http.open("POST", "sender.php", true);
  http.send(data);
  li.querySelector(".cross").onclick = () => http.abort();
  http.onabort = () => li.remove();

  if (file.type === "application/pdf") {
    const fileReader = new FileReader();

    fileReader.onload = function () {
      const typedarray = new Uint8Array(this.result);

      // Load the PDF document using PDF.js
      pdfjsLib.getDocument(typedarray).promise.then(function (pdf) {
        // Extract text from the first page
        pdf.getPage(1).then(function (page) {
          page.getTextContent().then(function (textContent) {
            const textItems = textContent.items;
            let extractedText = "";
            for (let i = 0; i < textItems.length; i++) {
              extractedText += textItems[i].str + " ";
            }

            // Preprocess the extracted text
            const preprocessedText = preprocessText(extractedText);

            // Store the preprocessed text for this file
            extractedTexts.push(preprocessedText);

            // Display the preprocessed text for all files
            displayExtractedTexts();

            // Store the extracted texts in local storage
            storeExtractedTexts();
          });
        });
      });
    };

    fileReader.readAsArrayBuffer(file);
  }

  handleFile(file);
}

// Preprocess the extracted text
function preprocessText(text) {
  // Remove unwanted characters, formatting, or noise using regular expressions
  const cleanedText = text
    .replace(/[^a-zA-Z0-9\s.]+/g, "")
    .replace(/\s{2,}/g, " ");

  // Remove unwanted images or image captions
  const withoutImages = cleanedText.replace(/\[Image\]/g, "");

  // Additional preprocessing steps can be added based on your specific requirements

  return withoutImages;
}

// Display the preprocessed text for all files
function displayExtractedTexts() {
  const textContainer = document.getElementById("textfrompdf");
  textContainer.textContent = extractedTexts.join("\n\n");
}

// Store the extracted texts in local storage
function storeExtractedTexts() {
  localStorage.setItem(storedPDFsKey, JSON.stringify(extractedTexts));
}

// Retrieve the stored extracted texts from local storage
function retrieveExtractedTexts() {
  const storedTexts = localStorage.getItem(storedPDFsKey);
  if (storedTexts) {
    extractedTexts.push(...JSON.parse(storedTexts));
    displayExtractedTexts();
  }
}

// find icon for file
function iconSelector(type) {
  var splitType =
    type.split("/")[0] == "application"
      ? type.split("/")[1]
      : type.split("/")[0];
  return splitType + ".png";
}

// Call the function to retrieve the stored extracted texts when the page loads
retrieveExtractedTexts();
