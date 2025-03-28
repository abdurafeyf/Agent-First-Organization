import logging

from langgraph.graph import StateGraph, START
from langchain_openai import ChatOpenAI

from arklex.env.workers.worker import register_worker
from arklex.env.workers.message_worker import MessageWorker
from arklex.env.tools.utils import ToolGenerator
from arklex.env.tools.RAG.search import SearchEngine
from arklex.utils.graph_state import MessageState
from arklex.utils.model_config import MODEL
from arklex.utils.model_provider_config import PROVIDER_MAP

logger = logging.getLogger(__name__)


@register_worker
class MarketInfoMessageWorker(MessageWorker):

    description = "The worker that used to deliver the message to the user, either a question or provide some information after retrieving it from Google."

    def __init__(self):
        super().__init__()
        self.action_graph = self._create_action_graph()
        self.llm = PROVIDER_MAP.get(MODEL['llm_provider'], ChatOpenAI)(
            model=MODEL["model_type_or_path"], timeout=30000
        )

    def _create_action_graph(self):
        workflow = StateGraph(MessageState)
        search_engine = SearchEngine()
        # Add nodes for each worker
        workflow.add_node("search_engine", search_engine.search)
        workflow.add_node("tool_generator", ToolGenerator.context_generate)
        
        # Add edges
        workflow.add_edge(START, "search_engine")
        workflow.add_edge("search_engine", "tool_generator")
        return workflow

    def execute(self, msg_state: MessageState):
        graph = self.action_graph.compile()
        result = graph.invoke(msg_state)
        return result

