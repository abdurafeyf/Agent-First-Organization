import logging

from langgraph.graph import StateGraph, START
from langchain_openai import ChatOpenAI

from arklex.env.workers.worker import BaseWorker, register_worker
from arklex.env.tools.utils import ToolGenerator
from arklex.env.tools.financial_tools.search import FinSearch
from arklex.utils.graph_state import MessageState
from arklex.utils.model_config import MODEL
from arklex.utils.model_provider_config import PROVIDER_MAP

logger = logging.getLogger(__name__)


@register_worker
class MarketInfoMessageWorker(BaseWorker):

    description = "This worker retrieves market information from google and provides it to the user. The market information includes information related to stocks, companies, and indices."

    def __init__(self):
        super().__init__()
        self.action_graph = self._create_action_graph()
        self.llm = PROVIDER_MAP.get(MODEL['llm_provider'], ChatOpenAI)(
            model=MODEL["model_type_or_path"], timeout=30000
        )

    def _create_action_graph(self):
        workflow = StateGraph(MessageState)
        fin_search = FinSearch(query="meezan bank psx update")
        # Add nodes for each worker
        workflow.add_node("fin_search", fin_search.search)
        workflow.add_node("tool_generator", ToolGenerator.context_generate)
        
        # Add edges
        workflow.add_edge(START, "fin_search")
        workflow.add_edge("fin_search", "tool_generator")
        return workflow

    def execute(self, msg_state: MessageState):
        graph = self.action_graph.compile()
        result = graph.invoke(msg_state)
        return result

