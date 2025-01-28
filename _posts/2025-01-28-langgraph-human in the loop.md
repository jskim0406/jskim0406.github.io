---
layout: post
title: langgraph - Human in the Loop
author: jskim
featuredImage: null
img: null
tags: LLM, langchain, langgraph, Interrupt, Human-in-the-loop
categories: LLM
date: '2025-01-28 00:15:00 +0900'
---

### LangGraph `Human-in-the-Loop`

LLM 기반 애플리케이션에서 `Human-in-the-Loop`(이하 'HIL')이 필요한 주요 Use Case는 다음과 같습니다.

1. **🛠️ Tool Call 검토**: LLM이 외부 도구(API, database 등)를 사용하기 전에, **인간이 Tool Call 요청을 검토, 편집, 승인**할 수 있습니다. 민감한 도구 사용이나, 예상치 못한 Tool Call 실행을 방지하여 시스템의 안정성을 확보합니다.
2. **✅ LLM Output 검증**: LLM이 생성한 콘텐츠를 **인간이 검토, 편집, 승인**합니다. 생성된 텍스트의 정확성, 적절성, 품질을 보장하여 사용자에게 신뢰성 있는 정보를 제공합니다.
3. **💡 추가 Context 제공**: LLM이 필요한 정보를 **명시적으로 인간에게 요청**할 수 있습니다. 복잡한 질문이나, 다단계 대화(Multi-turn Conversation)에서 LLM이 부족한 정보를 인간으로부터 보충받아 더욱 정확한 답변을 생성할 수 있도록 돕습니다.

### Human in the loop 구현 - `interrupt`와 `Command`

LangGraph는 `interrupt()` 함수와 `Command` 객체를 통해 HIL 워크플로우를 간편하게 구현할 수 있도록 지원합니다.

* **`interrupt()` 함수**: 그래프의 실행을 **일시 중지**시키고, 인간에게 필요한 정보를 전달합니다. 마치 영화의 "일시 정지" 버튼과 같습니다.
* **`Command` 객체**:  중지된 그래프를 **재개**시키고, 인간으로부터 받은 입력값이나, 그래프 상태 업데이트 명령을 LangGraph에 전달합니다. "재생" 버튼과 함께 필요한 "추가 정보"를 담아 전달하는 것이죠.

간단한 수도 코드 예시를 통해 `interrupt()`와 `Command`가 어떻게 사용되는지 살펴보겠습니다.

```python
from langgraph.types import interrupt, Command

def human_node(state: State): # 그래프 노드 정의
    text_to_revise = state["some_text"] # 그래프 상태에서 수정할 텍스트 가져오기

    user_input = interrupt( # 그래프 실행 중단 및 인간에게 정보 전달
        { "text_to_revise": text_to_revise } # 인간에게 보여줄 정보 (JSON 직렬화 가능)
    )
    # interrupt() 함수는 그래프를 중단시키고, Command 객체를 통해 재개될 때 사용자 입력을 반환합니다.

    revised_text = user_input # 인간으로부터 수정된 텍스트 받기

    return { "some_text": revised_text } # 수정된 텍스트로 그래프 상태 업데이트

# ... 그래프 빌드 및 컴파일 ...

# 그래프 실행 (interrupt()가 호출될 때까지)
thread_config = {"configurable": {"thread_id": "unique_thread_id"}}
graph.invoke({"some_text": "수정 전 텍스트"}, config=thread_config)

# ... 인간의 검토 및 수정 작업 ...

# 그래프 재개 (Command 객체를 통해 수정된 텍스트 전달)
revised_value_from_human = "인간이 수정한 텍스트"
graph.invoke(Command(resume=revised_value_from_human), config=thread_config)
```

위 예시에서 `human_node`는 `interrupt()` 함수를 호출하여 그래프 실행을 중단하고, `text_to_revise` 정보를 인간에게 전달합니다.  이후 인간은 전달받은 텍스트를 검토하고 수정합니다.  수정 작업이 완료되면, `Command(resume=revised_value_from_human)`를 통해 그래프를 재개하고, 수정된 텍스트를 `revised_text` 변수에 담아 그래프 상태를 업데이트합니다.

**핵심**: `interrupt()`는 그래프를 멈추고, `Command(resume=...)`는 멈춘 그래프를 다시 시작시키는 "리모컨" 역할을 합니다.

### LangGraph HIL 구현의 4가지 필수 조건

LangGraph에서 `interrupt`를 사용하기 위한 4가지 필수 조건은 다음과 같습니다.

1. **Checkpointer 설정**: 그래프의 각 단계 이후 상태를 저장하기 위해 **Checkpointer를 반드시 지정**해야 합니다. 이는 `interrupt` 이후 그래프를 재개할 때 필요한 정보입니다.
2. **`interrupt()` 호출**:  인간의 개입이 필요한 시점에 `interrupt()` 함수를 호출합니다.
3. **Thread ID로 그래프 실행**: 그래프를 실행할 때 **Thread ID를 명시**하여 실행해야 `interrupt` 기능이 정상적으로 작동합니다.
4. **`Command`로 실행 재개**: 중단된 그래프를 재개하기 위해 `invoke`, `ainvoke`, `stream`, `astream` 메서드와 함께 `Command` 객체를 사용해야 합니다.

### 다양한 디자인 패턴으로 HIL 활용하기

LangGraph HIL은 다양한 디자인 패턴으로 응용될 수 있습니다. 몇 가지 대표적인 패턴을 살펴보겠습니다.

#### 1. 승인 또는 거부 (Approve or Reject)

중요한 작업(API 호출, 데이터베이스 업데이트 등)을 실행하기 전에 **인간의 승인**을 받는 패턴입니다. 인간의 승인 여부에 따라 그래프의 흐름을 분기하여, 위험한 작업을 방지하거나, 대체 경로를 선택할 수 있습니다.

```python
def human_approval_node(state: State) -> Command:
    llm_output = state["llm_output"] # LLM 결과물

    is_approved = interrupt({ # 인간에게 승인 요청
        "question": "이 작업이 올바른가요?",
        "llm_output": llm_output
    })

    if is_approved: # 인간이 승인한 경우
        return Command(goto="next_node_approved") # 'next_node_approved' 노드로 진행
    else: # 인간이 거부한 경우
        return Command(goto="alternative_node") # 'alternative_node' 노드로 진행
```

#### 2. 상태 검토 및 편집 (Review & Edit State)

그래프의 중간 상태를 **인간이 검토하고 수정**하는 패턴입니다. LLM이 생성한 정보에 오류가 있거나, 추가 정보가 필요한 경우 인간이 직접 개입하여 그래프 상태를 보정할 수 있습니다.

```python
def human_editing_node(state: State):
    llm_summary = state["llm_generated_summary"] # LLM 요약 결과

    edited_text = interrupt({ # 인간에게 편집 요청
        "task": "LLM 요약 결과를 검토하고 필요한 부분을 수정하세요.",
        "llm_generated_summary": llm_summary
    })

    return { "llm_generated_summary": edited_text } # 인간이 편집한 텍스트로 상태 업데이트
```

#### 3. Tool Call 검토 (Review Tool Calls)

LLM이 요청한 Tool Call을 **인간이 검토하고 승인**하는 패턴입니다. 민감한 Tool Call 실행 전에 인간의 판단을 거쳐 시스템의 보안과 안정성을 강화합니다.

```python
def human_review_tool_call_node(state: State) -> Command:
    tool_call = state["tool_call"] # LLM이 요청한 Tool Call 정보

    review_action, review_data = interrupt({ # 인간에게 Tool Call 검토 요청
        "question": "이 Tool Call을 실행해도 될까요?",
        "tool_call": tool_call
    })

    if review_action == "continue": # 인간이 Tool Call 승인
        return Command(goto="run_tool_node") # 'run_tool_node' 로 진행
    elif review_action == "update": # 인간이 Tool Call 수정
        updated_tool_call = get_updated_tool_call(review_data) # 수정된 Tool Call 획득
        return Command(goto="run_tool_node", update={"tool_call": updated_tool_call}) # 수정된 Tool Call로 'run_tool_node' 진행
    elif review_action == "feedback": # 인간이 피드백 제공
        feedback_message = get_feedback_message(review_data) # 피드백 메시지 획득
        return Command(goto="llm_call_node", update={"messages": [feedback_message]}) # 피드백 메시지로 'llm_call_node' 진행
```

#### 4. 다단계 대화 (Multi-turn Conversation)

Agent와 인간이 **여러 차례 상호작용**하며 대화를 진행하는 패턴입니다. Agent는 필요한 정보를 인간에게 묻고, 인간은 답변을 제공하며, Agent는 답변을 바탕으로 다음 단계를 진행합니다.

```python
def human_input_node(state: State):
    user_message = interrupt("사용자 입력을 기다립니다.") # 사용자 입력 요청

    return { "messages": [{ "role": "human", "content": user_message }] } # 사용자 메시지를 상태에 추가

def agent_node(state: State):
    # ... Agent 로직 ...
    pass

# ... 그래프 구성 ...
graph_builder.add_node("human_input_node", human_input_node)
graph_builder.add_node("agent_node", agent_node)

graph_builder.add_edge("human_input_node", "agent_node")
graph_builder.add_edge("agent_node", "human_input_node") # Agent 노드에서 다시 Human 노드로 순환 연결 (다단계 대화)
```

### `Command` 객체, 그래프 재개의 핵심 제어 장치

`Command` 객체는 그래프 실행을 재개할 때 다양한 옵션을 제공합니다.

* **`resume`**: `interrupt()` 함수가 반환할 값을 지정합니다. 인간으로부터 받은 입력값(텍스트, 승인 여부 등)을 `resume` 파라미터에 담아 그래프에 전달합니다.
* **`update`**: 그래프의 상태를 업데이트합니다. `Command` 객체를 통해 그래프를 재개하면서 동시에 상태를 변경할 수 있습니다.
* **`goto`**: 특정 노드로 그래프의 흐름을 이동시킵니다. 조건부 분기(Approve/Reject 패턴)를 구현할 때 유용하게 사용됩니다.

### Interrupt 후 Node 재실행, 어떻게 동작할까?

**주의**: LangGraph의 `interrupt`는 Python의 `input()` 함수와는 다르게 동작합니다. `input()`은 정확히 호출된 지점부터 실행을 재개하지만, **LangGraph의 `interrupt`는 `interrupt`가 호출된 Node의 시작 부분부터 다시 실행**됩니다!

예를 들어, 다음과 같은 그래프를 생각해 봅시다.

```
Graph = [Node A <> Node B(interrupt) <> Node C]
```

그래프 실행 중 `Node B`에서 `interrupt`가 발생하여 멈췄다고 가정합니다. 이후 `Command` 객체를 통해 그래프를 재개하면, **`Node B`의 시작 부분부터 다시 실행**됩니다. `Node A`는 이미 실행이 완료되었으므로 다시 실행되지 않습니다.

**Subgraph와 Interrupt**: Subgraph가 function 형태로 parent graph에 포함된 경우에도 유사하게 동작합니다. Parent graph는 subgraph를 호출한 노드부터, subgraph는 interrupt가 발생한 노드부터 재실행됩니다.

**핵심**: Interrupt 이후 재개 시, 전체 그래프가 아닌 **Interrupt가 발생한 Node부터 재실행**된다는 점을 꼭 기억해야 합니다.

Subgraph 내부에 `interrupt`가 있는 경우, 재실행 로직은 다소 복잡해집니다.

- **Parent Graph**: Subgraph를 호출하는 부모 그래프의 노드는 Subgraph가 `interrupt`로 인해 일시 중지된 후 재개될 때, **해당 노드의 처음부터 다시 실행**됩니다.
- **Subgraph**: `interrupt`가 포함된 Subgraph의 노드는 재개될 때, **해당 노드의 처음부터 다시 실행**됩니다.

이해를 돕기 위해 다음 시나리오를 살펴봅시다.

- **Parent Graph**: `node_A` → `node_B` (Subgraph 호출) → `node_C`
- **Subgraph**: `sub_node_1` → `sub_node_2` (`interrupt` 포함) → `sub_node_3`

이 경우, `interrupt` 이후 재개 시 실행 순서는 다음과 같습니다.

1. `node_A`는 이미 실행되었으므로 건너뜁니다. (체크포인트 덕분에)
2. `node_B`는 Subgraph를 호출하므로 **처음부터 다시 실행**됩니다.
3. `sub_node_1`은 이미 실행되었으므로 건너뜁니다.
4. `sub_node_2`는 `interrupt`를 포함하고 있으므로 **처음부터 다시 실행**됩니다. (이때, `interrupt`는 `Command`의 `resume` 값을 받습니다.)
5. `sub_node_3`이 실행됩니다.
6. `node_B`의 나머지 부분이 실행됩니다. (Subgraph 호출 이후)
7. `node_C`가 실행됩니다.

**쉽게 말해, 겹겹이 쌓인 상자를 생각하면 됩니다. 가장 바깥 상자(`node_B`)를 열었다가 닫으면, 그 안의 상자(`sub_node_2`)도 다시 열어야 합니다.**

#### 예시

다음 코드는 부모 그래프와 Subgraph의 실행 순서를 명확하게 보여줍니다.

```python
import uuid
from typing import TypedDict
from langgraph.graph import StateGraph
from langgraph.constants import START
from langgraph.types import interrupt, Command
from langgraph.checkpoint.memory import MemorySaver

# -- (1) Subgraph 정의 --
class SubState(TypedDict):
   sub_counter: int

sub_counter = 0

def sub_node_1(state: SubState):
    global sub_counter
    sub_counter += 1
    print(f"  > Subgraph: `sub_node_1` 실행 횟수: {sub_counter}")
    return {"sub_counter": state["sub_counter"] + 1}

def sub_node_2(state: SubState):
    print(f"  > Subgraph: `sub_node_2` 실행")
    value = interrupt("Subgraph 입력 대기 중...")
    print(f"  > Subgraph: `sub_node_2` 입력 값: {value}")
    return {"sub_counter": state["sub_counter"] + 1}

subgraph_builder = StateGraph(SubState)
subgraph_builder.add_node("sub_node_1", sub_node_1)
subgraph_builder.add_node("sub_node_2", sub_node_2)
subgraph_builder.add_edge(START, "sub_node_1")
subgraph_builder.add_edge("sub_node_1", "sub_node_2")
subgraph_builder.set_finish("sub_node_2")
subgraph = subgraph_builder.compile(checkpointer=MemorySaver())

# -- (2) Parent Graph 정의 --
class ParentState(TypedDict):
    counter: int
    sub_state: SubState

parent_counter = 0

def parent_node_1(state: ParentState):
    global parent_counter
    parent_counter += 1
    print(f"> Parent: `parent_node_1` 실행 횟수: {parent_counter}")
    return {"counter": state["counter"] + 1, "sub_state": {"sub_counter": 0}}

def parent_node_2(state: ParentState):
    global parent_counter
    parent_counter += 1
    print(f"> Parent: `parent_node_2` 실행 횟수: {parent_counter}")
    # Subgraph 호출: parent_node_2의 `sub_state` 입력 값으로 ParentState의 `sub_state`를 활용.
    # 그리고 parent_node_2의 `sub_state`의 반환 값을 ParentState의 `sub_state`로 넣는다.
    sub_state = subgraph.invoke(state["sub_state"])
    return {"counter": state["counter"] + 1, "sub_state": sub_state}

builder = StateGraph(ParentState)
builder.add_node("parent_node_1", parent_node_1)
builder.add_node("parent_node_2", parent_node_2)
builder.add_edge(START, "parent_node_1")
builder.add_edge("parent_node_1", "parent_node_2")
builder.set_finish("parent_node_2")

# -- (3) Checkpointer 설정 및 Graph Compile --
checkpointer = MemorySaver()
graph = builder.compile(checkpointer=checkpointer)

# -- (4) 그래프 실행 --
config = {"configurable": {"thread_id": uuid.uuid4()}}

# 첫 번째 실행
for event in graph.stream({"counter": 0}, config):
    print("-" * 40)
    print(f"{event=}")

print("=" * 40)

# 두 번째 실행 (재개)
for event in graph.stream(Command(resume="입력값!"), config):
    print("-" * 40)
    print(f"{event=}")
```

**출력 결과**

```
----------------------------------------
event={'parent_node_1': {'counter': 1, 'sub_state': {'sub_counter': 0}}}
> Parent: `parent_node_1` 실행 횟수: 1
----------------------------------------
event={'parent_node_2': {'counter': 2, 'sub_state': {'sub_counter': 2}}}
> Parent: `parent_node_2` 실행 횟수: 1
  > Subgraph: `sub_node_1` 실행 횟수: 1
  > Subgraph: `sub_node_2` 실행
----------------------------------------
event={'__interrupt__': (Interrupt(value='Subgraph 입력 대기 중...', resumable=True, ns=['parent_node_2:9f864241-239d-4251-892b-2277f72fe9d4', 'sub_node_2:139d157f-5448-45f6-93c4-66587b454b9d'], when='during'),)}
========================================
----------------------------------------
event={'parent_node_2': {'counter': 2, 'sub_state': {'sub_counter': 2}}}
> Parent: `parent_node_2` 실행 횟수: 2
  > Subgraph: `sub_node_2` 실행
  > Subgraph: `sub_node_2` 입력 값: 입력값!
----------------------------------------
event={'$end': {'counter': 2, 'sub_state': {'sub_counter': 2}}}
```

**출력 분석**

1. **첫 번째 실행**:
    - `parent_node_1`이 실행됩니다. (횟수: 1)
    - `parent_node_2`가 실행되고, `subgraph.invoke`를 호출합니다. (횟수: 1)
    - Subgraph의 `sub_node_1`이 실행됩니다. (횟수: 1)
    - Subgraph의 `sub_node_2`가 실행되고, `interrupt`를 만나 일시 중지됩니다.
    - `__interrupt__` 이벤트가 발생하여 사용자 입력을 기다립니다.

2. **두 번째 실행 (재개)**:
    - `parent_node_2`가 **다시 실행**됩니다. (횟수: 2) - `resume`으로 인한 재실행
    - Subgraph의 `sub_node_2`가 **다시 실행**되고, `resume`으로 전달받은 "입력값!"을 사용합니다.
    - 마지막으로 `$end` 이벤트가 발생하며 실행이 종료됩니다.

이처럼 Subgraph 내부의 `interrupt`는 부모 그래프와 Subgraph의 노드 재실행에 영향을 미칩니다. 따라서, **HIL을 설계할 때는 이러한 재실행 로직을 충분히 고려하여 의도하지 않은 부작용이 발생하지 않도록 주의해야 합니다.**


### Referene
- [`langgraph` Human-in-the-loop](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/)
- [LangGraph Glossary](https://langchain-ai.github.io/langgraph/concepts/low_level/)
- w/ `claude`