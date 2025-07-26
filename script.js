/* DOM elements */

// Cloudflare Worker endpoint for secure API handling
const OPENAI_API_URL =
  "https://lorealsmartproductadvisor.tnguyen9813.workers.dev/";

// Get DOM elements
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const faceSelection = document.getElementById("faceSelection");
const chatInterface = document.getElementById("chatInterface");
const backToSelection = document.getElementById("backToSelection");
const faceAreas = document.querySelectorAll(".face-area");
const concernBtns = document.querySelectorAll(".concern-btn");
const currentQuestion = document.getElementById("currentQuestion");
const questionText = document.getElementById("questionText");

// Store conversation context
let messages = [];
let userName = "";
let selectedArea = "";
let selectedConcern = "";

/* Face area selection handlers */

// When a face area is selected, show chat and add context
faceAreas.forEach((area) => {
  area.addEventListener("click", (e) => {
    selectedArea = e.target.dataset.area;
    // Add system message to context
    messages = [
      {
        role: "system",
        content:
          "You are a helpful beauty assistant. Track the user's name and previous questions to provide personalized, multi-turn advice.",
      },
    ];
    showChatInterface(selectedArea);
  });
});

// When a concern is selected, show chat and add context
concernBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    selectedConcern = e.target.dataset.concern;
    messages = [
      {
        role: "system",
        content:
          "You are a helpful beauty assistant. Track the user's name and previous questions to provide personalized, multi-turn advice.",
      },
    ];
    showChatInterface(selectedConcern);
  });
});

/* Show chat interface with initial message */

// Show chat interface and add a greeting message to context
function showChatInterface(selection) {
  faceSelection.style.display = "none";
  chatInterface.style.display = "block";

  // Hide current question initially (will show when user asks first question)
  currentQuestion.style.display = "none";

  // Initial greeting based on selection
  const greetings = {
    forehead:
      "Great! You selected the forehead area. I can help you with products for forehead concerns like acne, wrinkles, or oiliness. What specific issues would you like to address?",
    eyes: "Perfect! You're focusing on the eye area. I can recommend products for dark circles, puffiness, fine lines, or eye makeup. What's your main concern?",
    nose: "You selected the nose area. I can help with products for blackheads, large pores, oiliness, or contouring. What would you like to work on?",
    cheeks:
      "Great choice! For the cheek area, I can suggest products for blush, contouring, acne, or general skincare. What's your main goal?",
    lips: "You're focusing on lips! I can recommend lip care products, lipsticks, glosses, or treatments for dry/chapped lips. What are you looking for?",
    chin: "You selected the chin area. I can help with products for chin acne, contouring, or general skincare. What's your concern?",
    acne: "You're concerned about acne. I can recommend targeted treatments, cleansers, and skincare routines to help clear your skin. Tell me more about your skin type!",
    aging:
      "Anti-aging is your focus! I can suggest serums, moisturizers, and treatments to help with fine lines, wrinkles, and skin firmness. What's your main concern?",
    dryness:
      "Dry skin can be challenging! I can recommend hydrating products, moisturizers, and gentle cleansers to restore your skin's moisture. How severe is the dryness?",
    oily: "Oily skin needs special care! I can suggest oil-control products, mattifying treatments, and proper cleansing routines. What's bothering you most?",
    sensitive:
      "Sensitive skin requires gentle care! I can recommend fragrance-free, hypoallergenic products that won't irritate. What triggers your sensitivity?",
  };

  // Add AI greeting to context
  messages.push({
    role: "assistant",
    content: greetings[selection] || "Hello! How can I help you today?",
  });

  // Create AI message bubble without emoji prefix (CSS will add it)
  const aiDiv = document.createElement("div");
  aiDiv.className = "msg ai";
  aiDiv.textContent =
    greetings[selection] || "Hello! How can I help you today?";
  chatWindow.innerHTML = "";
  chatWindow.appendChild(aiDiv);
}

/* Back to selection handler */

backToSelection.addEventListener("click", () => {
  faceSelection.style.display = "block";
  chatInterface.style.display = "none";
  currentQuestion.style.display = "none";
  selectedArea = "";
  selectedConcern = "";
  messages = [];
  userName = "";
});

/* Handle form submit */

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // Disable send button during API call
  const sendBtn = document.getElementById("sendBtn");
  sendBtn.disabled = true;

  // Add user message to context
  messages.push({ role: "user", content: userMessage });

  // Display current question above chat
  questionText.textContent = userMessage;
  currentQuestion.style.display = "block";

  // Try to extract user's name if they introduce themselves
  if (!userName) {
    const nameMatch = userMessage.match(
      /(?:my name is|i'm|i am|call me)\s+([a-zA-Z]+)/i
    );
    if (nameMatch) {
      userName = nameMatch[1];
    }
  }

  // Add user message to chat window
  const userDiv = document.createElement("div");
  userDiv.className = "msg user";
  userDiv.textContent = userMessage;
  chatWindow.appendChild(userDiv);
  userInput.value = "";

  // Show typing indicator
  const typingDiv = document.createElement("div");
  typingDiv.className = "typing-indicator";
  typingDiv.innerHTML = "<span></span><span></span><span></span>";
  chatWindow.appendChild(typingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // Make API call through Cloudflare Worker
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a specialized L'Oréal Beauty Assistant AI. Your expertise is exclusively focused on L'Oréal products, beauty routines, and personalized recommendations.

WHAT YOU CAN HELP WITH:
- L'Oréal makeup products (foundations, lipsticks, mascaras, eyeshadows, etc.)
- L'Oréal skincare products (cleansers, moisturizers, serums, treatments)
- L'Oréal haircare products (shampoos, conditioners, treatments, styling products)
- L'Oréal fragrances and perfumes
- Beauty routines and application techniques
- Product recommendations based on skin type, concerns, and preferences
- Color matching and shade recommendations
- Ingredient information for L'Oréal products
- General beauty tips related to L'Oréal products

IMPORTANT GUIDELINES:
- ONLY discuss L'Oréal products and beauty-related topics
- If asked about non-L'Oréal products, politely redirect to L'Oréal alternatives
- If asked about unrelated topics (politics, weather, general knowledge, etc.), politely decline and redirect to beauty topics
- Always maintain a friendly, helpful, and professional tone
- Provide specific product names and detailed recommendations when possible

CONTEXT FOR THIS CONVERSATION:
${selectedArea ? `- User is focused on: ${selectedArea}` : ""}
${selectedConcern ? `- User's main concern: ${selectedConcern}` : ""}
${userName ? `- User's name: ${userName}` : ""}

If someone asks about topics unrelated to L'Oréal or beauty, respond with: "I'm here to help you with L'Oréal products and beauty advice! Let's talk about how I can help you achieve your beauty goals. What would you like to know about L'Oréal's makeup, skincare, haircare, or fragrances?"

Keep responses conversational, informative, and focused on helping users discover the perfect L'Oréal products for their needs.`,
          },
          ...messages,
        ],
        max_tokens: 600,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    // Remove typing indicator
    if (chatWindow.contains(typingDiv)) {
      chatWindow.removeChild(typingDiv);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `API request failed: ${response.status} ${
          errorData?.error?.message || ""
        }`
      );
    }

    const data = await response.json();

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response structure from API");
    }

    const aiResponse = data.choices[0].message.content;

    // Add AI response to context and chat
    messages.push({ role: "assistant", content: aiResponse });
    const aiDiv = document.createElement("div");
    aiDiv.className = "msg ai";
    aiDiv.textContent = aiResponse;
    chatWindow.appendChild(aiDiv);
  } catch (error) {
    // Remove typing indicator if there was an error
    if (chatWindow.contains(typingDiv)) {
      chatWindow.removeChild(typingDiv);
    }

    console.error("Error calling OpenAI API:", error);

    // Provide specific error messages based on error type
    let aiResponse;
    if (error.message.includes("401")) {
      aiResponse =
        "I'm having authentication issues. Please check the API configuration.";
    } else if (error.message.includes("429")) {
      aiResponse =
        "I'm receiving too many requests right now. Please wait a moment and try again.";
    } else if (error.message.includes("500")) {
      aiResponse =
        "The AI service is temporarily unavailable. Please try again in a few moments.";
    } else {
      aiResponse = userName
        ? `Sorry ${userName}, I'm having trouble connecting right now. Please try again in a moment.`
        : "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
    }

    messages.push({ role: "assistant", content: aiResponse });
    const aiDiv = document.createElement("div");
    aiDiv.className = "msg ai";
    aiDiv.textContent = aiResponse;
    chatWindow.appendChild(aiDiv);
  } finally {
    // Re-enable send button and scroll to bottom
    sendBtn.disabled = false;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});
