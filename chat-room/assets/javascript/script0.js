const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-container");
const themeButton = document.querySelector("#theme-btn");
const deleteButton = document.querySelector("#delete-btn");
const imageInput = document.querySelector("#image-input");
const addImageButton = document.querySelector("#add-image-btn");
const wordCountDisplay = document.querySelector("#word-count");

let wordCount = 10; // Default word count
let userText = null;
const API_KEY = ""; // Paste your API key here

const loadDataFromLocalstorage = () => {
  // Load saved chats and theme from local storage and apply/add on the page
  const themeColor = localStorage.getItem("themeColor");

  document.body.classList.toggle("light-mode", themeColor === "light_mode");
  themeButton.innerText = document.body.classList.contains("light-mode")
    ? "dark_mode"
    : "light_mode";

  const defaultText = `<div class="default-text">
                            <h1>NEXUS AI</h1>
                            <p>Start a conversation and explore the power of AI.<br> Your chat history will be displayed here.</p>
                        </div>`;

  chatContainer.innerHTML = localStorage.getItem("all-chats") || defaultText;
  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to bottom of the chat container
};

const createChatElement = (content, className) => {
  // Create new div and apply chat, specified class and set html content of div
  const chatDiv = document.createElement("div");
  chatDiv.classList.add("chat", className);
  chatDiv.innerHTML = content;
  return chatDiv; // Return the created chat div
};

const getChatResponse = async (incomingChatDiv) => {
  const API_URL = "https://api.openai.com/v1/completions";
  const pElement = document.createElement("p");

  // Define the properties and data for the API request
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-davinci-003",
      prompt: userText,
      max_tokens: 2048,
      temperature: 0.2,
      n: 1,
      stop: null,
    }),
  };

  // Send POST request to API, get response and set the reponse as paragraph element text
  try {
    const response = await (await fetch(API_URL, requestOptions)).json();
    pElement.textContent = response.choices[0].text.trim();
  } catch (error) {
    // Add error class to the paragraph element and set error text
    pElement.classList.add("error");
    pElement.textContent =
      "Oops! Something went wrong while retrieving the response. Please try again.";
  }

  // Remove the typing animation, append the paragraph element and save the chats to local storage
  incomingChatDiv.querySelector(".typing-animation").remove();
  incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
  localStorage.setItem("all-chats", chatContainer.innerHTML);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
};

const copyResponse = (copyBtn) => {
  // Copy the text content of the response to the clipboard
  const reponseTextElement = copyBtn.parentElement.querySelector("p");
  navigator.clipboard.writeText(reponseTextElement.textContent);
  copyBtn.textContent = "done";
  setTimeout(() => (copyBtn.textContent = "content_copy"), 1000);
};

const showTypingAnimation = () => {
    // Display the typing animation and call the getChatResponse function
    const html = `<div class="chat-content">
                      <div class="chat-details">
                          <div class="typing-animation">
                              <div class="typing-dot" style="--delay: 0.2s"></div>
                              <div class="typing-dot" style="--delay: 0.3s"></div>
                              <div class="typing-dot" style="--delay: 0.4s"></div>
                          </div>
                      </div>
                      <span onclick="copyResponse(this)" class="material-symbols-rounded">content_copy</span>
                  </div>`;
    // Create an incoming chat div with typing animation and append it to chat container
    const incomingChatDiv = createChatElement(html, "incoming");
    chatContainer.appendChild(incomingChatDiv);
    
    setTimeout(() => {
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
      getChatResponse(incomingChatDiv);
    }, 0);
  };
  

const sanitizeInput = (input) => {
  // Remove HTML tags from the input
  const div = document.createElement("div");
  div.innerHTML = input;
  const sanitizedInput = div.textContent || div.innerText;

  // Remove special characters
  const sanitizedText = sanitizedInput.replace(/[^\w\s]/gi, "");

  return sanitizedText.trim();
};

const handleOutgoingChat = () => {
  userText = chatInput.value.trim();
  if (!userText) return;

  // Sanitize the user's input
  const sanitizedText = sanitizeInput(userText);

  // Clear the input field and reset its height
  chatInput.value = "";
  chatInput.style.height = `${initialInputHeight}px`;

  if (imageInput.files && imageInput.files[0]) {
    // Handle image upload if a file is selected
    const imageFile = imageInput.files[0];
    displayImageMessage(imageFile);
    imageInput.value = ""; // Reset the value to allow selecting the same file again (if needed)
  } else {
    // Handle regular text message
    const html = `<div class="chat-content">
                    <div class="chat-details">
                        <p>${sanitizedText}</p>
                    </div>
                  </div>`;

    const outgoingChatDiv = createChatElement(html, "outgoing");
    chatContainer.querySelector(".default-text")?.remove();
    chatContainer.appendChild(outgoingChatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    setTimeout(showTypingAnimation, 500);

    // Update the word count based on the selected radio button
    const selectedRadioButton = document.querySelector('input[name="marks"]:checked');
    wordCount = parseInt(selectedRadioButton.value);
    wordCountDisplay.innerText = `Word Count: ${wordCount}`;
  }
};

const radioButtons = document.querySelectorAll('input[name="marks"]');
radioButtons.forEach((radioButton) => {
  radioButton.addEventListener("change", () => {
    if (radioButton.checked) {
      wordCount = parseInt(radioButton.value);
      wordCountDisplay.innerText = `Word Count: ${wordCount}`;
    }
  });
});

const displayImageMessage = (imageFile) => {
  // Display the selected image as an outgoing message
  const imageUrl = URL.createObjectURL(imageFile);
  const imageElement = document.createElement("img");
  imageElement.src = imageUrl;
  imageElement.alt = "Uploaded Image";

  const chatContentDiv = document.createElement("div");
  chatContentDiv.classList.add("chat-content");
  const chatDetailsDiv = document.createElement("div");
  chatDetailsDiv.classList.add("chat-details");
  chatDetailsDiv.appendChild(imageElement);
  chatContentDiv.appendChild(chatDetailsDiv);

  const outgoingChatDiv = createChatElement(chatContentDiv.outerHTML, "outgoing");
  chatContainer.querySelector(".default-text")?.remove();
  chatContainer.appendChild(outgoingChatDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
};

deleteButton.addEventListener("click", () => {
  // Remove the chats from local storage and call loadDataFromLocalstorage function
  if (confirm("Are you sure you want to delete all the chats?")) {
    localStorage.removeItem("all-chats");
    loadDataFromLocalstorage();
  }
});

themeButton.addEventListener("click", () => {
  // Toggle body's class for the theme mode and save the updated theme to the local storage
  document.body.classList.toggle("light-mode");
  localStorage.setItem("themeColor", themeButton.innerText);
  themeButton.innerText = document.body.classList.contains("light-mode")
    ? "dark_mode"
    : "light_mode";
});

const initialInputHeight = chatInput.scrollHeight;

chatInput.addEventListener("input", () => {
  // Adjust the height of the input field dynamically based on its content
  chatInput.style.height = `${initialInputHeight}px`;
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
  // If the Enter key is pressed without Shift and the window width is larger
  // than 800 pixels, handle the outgoing chat
  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
    e.preventDefault();
    handleOutgoingChat();
  }
});

loadDataFromLocalstorage();
sendButton.addEventListener("click", handleOutgoingChat);

addImageButton.addEventListener("click", () => {
  // Trigger the file input dialog to select an image file
  imageInput.click();
});

imageInput.addEventListener("change", () => {
  // Handle the image selection after the file input changes
  if (imageInput.files && imageInput.files[0]) {
    const imageFile = imageInput.files[0];
    displayImageMessage(imageFile);
    imageInput.value = ""; // Reset the value to allow selecting the same file again (if needed)
  }
});


/*==================== TEXT TO SPEECH ====================*/
const chatItems = document.querySelectorAll(".chat");
const readAllBtn = document.getElementById("read-all-btn");
let currentIndex = 0;
let isSpeaking = false;

function textToSpeech(text) {
  const speechSynthesis = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
}

function readAllText() {
  if (currentIndex < chatItems.length) {
    const currentText = chatItems[currentIndex].textContent;
    textToSpeech(currentText);
    currentIndex++;
    isSpeaking = true;
    setTimeout(readAllText, 1000); // Delay between reading each text (1 second in this example)
  } else {
    currentIndex = 0; // Reset index to start from the beginning if all texts have been read
    isSpeaking = false;
  }
}

readAllBtn.addEventListener("click", function() {
  if (!isSpeaking) {
    readAllText();
  }
});

/*=============== LODING SCREEN ===============*/
window.addEventListener("load", function () {
    const loader = document.querySelector(".loader");
    loader.className += " hidden";
  });

/*==================== SHOW NAVBAR ====================*/
const showMenu = (headerToggle, navbarId) =>{
    const toggleBtn = document.getElementById(headerToggle),
    nav = document.getElementById(navbarId)
    
    // Validate that variables exist
    if(headerToggle && navbarId){
        toggleBtn.addEventListener('click', ()=>{
            // We add the show-menu class to the div tag with the nav__menu class
            nav.classList.toggle('show-menu')
            // change icon
            toggleBtn.classList.toggle('bx-x')
        })
    }
}
showMenu('header-toggle','navbar')

/*==================== LINK ACTIVE ====================*/
const linkColor = document.querySelectorAll('.nav__link')

function colorLink(){
    linkColor.forEach(l => l.classList.remove('active'))
    this.classList.add('active')
}

linkColor.forEach(l => l.addEventListener('click', colorLink))


