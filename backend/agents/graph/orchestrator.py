from langgraph.graph import END, StateGraph

from agents.discovery import run_discovery
from agents.document import run_document_agent
from agents.drafting import run_drafting_agent
from agents.escalation import run_escalation_agent
from graph.state import AgentState


def route_after_discovery(state: AgentState) -> str:
    if state.get("error"):
        return "escalation"
    return "document"


def route_after_document(state: AgentState) -> str:
    if state.get("error"):
        return "escalation"
    if state.get("ready_for_drafting"):
        return "drafting"
    return END


def route_after_drafting(state: AgentState) -> str:
    if state.get("escalation_needed"):
        return "escalation"
    return END


def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("discovery", run_discovery)
    graph.add_node("document", run_document_agent)
    graph.add_node("drafting", run_drafting_agent)
    graph.add_node("escalation", run_escalation_agent)

    graph.set_entry_point("discovery")
    graph.add_conditional_edges("discovery", route_after_discovery)
    graph.add_conditional_edges("document", route_after_document)
    graph.add_conditional_edges("drafting", route_after_drafting)
    graph.add_edge("escalation", END)

    return graph.compile()
