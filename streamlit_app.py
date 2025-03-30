import os
import json
import time
import logging
import atexit
from dotenv import load_dotenv
import streamlit as st

from arklex.utils.utils import init_logger
from arklex.orchestrator.orchestrator import AgentOrg
from create import API_PORT
from arklex.utils.model_config import MODEL
from arklex.utils.model_provider_config import LLM_PROVIDERS
from arklex.env.env import Env

# Load environment variables
load_dotenv()

def terminate_subprocess():
    """Dummy termination function if needed."""
    pass

atexit.register(terminate_subprocess)

def get_api_bot_response(args, history, user_text, parameters, env):
    """Call the agent orchestrator to get a bot response."""
    data = {"text": user_text, "chat_history": history, "parameters": parameters}
    orchestrator = AgentOrg(config=os.path.join(args["input_dir"], "taskgraph.json"), env=env)
    result = orchestrator.get_response(data)
    return result["answer"], result["parameters"], result["human-in-the-loop"]

# Update configuration for your financial service package
args = {
    "input_dir": "./examples/financial_service_pak",  # update path as needed
    "model": MODEL["model_type_or_path"],
    "llm_provider": MODEL["llm_provider"],
    "log_level": "WARNING"
}
os.environ["DATA_DIR"] = args["input_dir"]
MODEL["model_type_or_path"] = args["model"]
MODEL["llm_provider"] = args["llm_provider"]
log_level = getattr(logging, args["log_level"].upper(), logging.WARNING)
logger = init_logger(log_level=log_level, filename=os.path.join(os.path.dirname(__file__), "logs", "arklex.log"))

# Load configuration from taskgraph.json
config_path = os.path.join(args["input_dir"], "taskgraph.json")
with open(config_path, "r") as f:
    config = json.load(f)

# Initialize the environment for the agent
env = Env(
    tools=config.get("tools", []),
    workers=config.get("workers", []),
    slotsfillapi=config["slotfillapi"]
)

# Determine the starting message from the config file
start_message = "Hello!"
for node in config.get("nodes", []):
    if node[1].get("type", "") == "start":
        start_message = node[1]["attribute"]["value"]
        break

# Initialize conversation history and parameters in session_state
if "history" not in st.session_state:
    st.session_state.history = [{"role": "assistant", "content": start_message}]
if "params" not in st.session_state:
    st.session_state.params = {}

# Function to process new messages
def submit_message():
    user_message = st.session_state.user_input.strip()
    if not user_message:
        return
    # Append user message
    st.session_state.history.append({"role": "user", "content": user_message})
    start_time = time.time()
    # Get bot response
    output, st.session_state.params, _ = get_api_bot_response(
        args, st.session_state.history, user_message, st.session_state.params, env
    )
    elapsed_time = time.time() - start_time
    logger.info(f"getAPIBotResponse Time: {elapsed_time}")
    st.session_state.history.append({"role": "assistant", "content": output})
    # Clear input field
    st.session_state.user_input = ""

# Display conversation using Streamlit's chat_message layout
st.title("Chat Bot")
st.write("Chat interface powered by Arklex.")

# (If available in your Streamlit version; otherwise, use st.markdown.)
if hasattr(st, "chat_message"):
    for msg in st.session_state.history:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
else:
    # Fallback if st.chat_message isn't available:
    st.header("Conversation")
    for msg in st.session_state.history:
        if msg["role"] == "assistant":
            st.markdown(f"**Bot:** {msg['content']}")
        else:
            st.markdown(f"**You:** {msg['content']}")

# Input field with on_change callback; this automatically processes and clears input
st.text_input("Your message:", key="user_input", on_change=submit_message)
