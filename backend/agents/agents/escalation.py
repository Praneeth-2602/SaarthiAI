from graph.state import AgentState


async def run_escalation_agent(state: AgentState) -> dict:
    message = (
        "Escalation workflows are out of scope for the MVP, but Saarthi has preserved the case state "
        "so this can be added without changing the public API."
    )
    return {
        **state,
        "messages": [*state.get("messages", []), {"role": "assistant", "content": message}],
        "current_agent": "escalation",
    }
