---
layout: post
title: langgraph - Persistence (2) sinlge, multi thread persistence
author: jskim
featuredImage: null
img: null
tags: LLM, langchain, langgraph, Persistence
categories: LLM
date: '2025-01-26 00:50:00 +0900'
---

### Reference
- [`langgraph` Persistence doc](https://langchain-ai.github.io/langgraph/concepts/persistence/)
- [`langgraph` subgraph doc](https://langchain-ai.github.io/langgraph/how-tos/subgraph/#add-a-node-with-the-compiled-subgraph)
- [`langgraph` "How to add cross-thread persistence to your graph"](https://langchain-ai.github.io/langgraph/how-tos/cross-thread-persistence/)
- with `claude`


## 다양한 형태의 Persistence 구현
langgraph에서 구현할 수 있는 graph의 형태는 매우 다양합니다. graph 형태에 관련없이 항상 `persistence`를 구현할 수 있어야 완결성 높은 라이브러리일 것입니다.

앞서 `thread_id`, `checkpoint_id`로 대표되는 config를 통해 Persistence를 구현하는 것을 볼 수 있었습니다.
- *[post "langgraph - Persistence(checkpoint, update state)"](https://jskim0406.github.io/posts/langgraph-persistence/)*

### Thread Level Persistence - `subgraph`
Graph가 `sub-graph`를 갖는 구조에서 persistence를 가지려면, `Parent-graph`의 checkpointer를 `sub-graph` compile에 적용해주면 됩니다. 아주 간단하죠. Persistence를 유지할 graph의 최상단 그래프에 checkpointer를 연결하면, 이는 하위의 그래프(`sub-graph`)에 자동 전파('automatically propagate') 됩니다.

```python
from langgraph.graph import START, StateGraph
from langgraph.checkpoint.memory import MemorySaver
from typing import TypedDict


# subgraph
class SubgraphState(TypedDict):
    foo: str  # note that this key is shared with the parent graph state
    bar: str


def subgraph_node_1(state: SubgraphState):
    return {"bar": "bar"}


def subgraph_node_2(state: SubgraphState):
    # note that this node is using a state key ('bar') that is only available in the subgraph
    # and is sending update on the shared state key ('foo')
    return {"foo": state["foo"] + state["bar"]}


subgraph_builder = StateGraph(SubgraphState)
subgraph_builder.add_node(subgraph_node_1)
subgraph_builder.add_node(subgraph_node_2)
subgraph_builder.add_edge(START, "subgraph_node_1")
subgraph_builder.add_edge("subgraph_node_1", "subgraph_node_2")
subgraph = subgraph_builder.compile()


# parent graph
class State(TypedDict):
    foo: str


def node_1(state: State):
    return {"foo": "hi! " + state["foo"]}


builder = StateGraph(State)
builder.add_node("node_1", node_1)
# note that we're adding the compiled subgraph as a node to the parent graph
builder.add_node("node_2", subgraph)
builder.add_edge(START, "node_1")
builder.add_edge("node_1", "node_2")


# checkpointer for persistence. only to parent graph(here "builder").

checkpointer = MemorySaver()
# You must only pass checkpointer when compiling the parent graph.
# LangGraph will automatically propagate the checkpointer to the child subgraphs.
graph = builder.compile(checkpointer=checkpointer)
```

- 출처: [`langgraph` subgraph doc](https://langchain-ai.github.io/langgraph/how-tos/subgraph/#add-a-node-with-the-compiled-subgraph)

위와 같이 sub-graph 객체인 `subgraph`와 parent-graph 객체인 `builder` 중 `builder`의 compile에 checkpointer를 지정합니다.

```python
graph = builder.compile(checkpointer=checkpointer)
```

### Cross-Thread Persistence(with `Store`)

위에서는 단일 thread 환경 속에서 persistence를 갖는 간단한 방법을 살펴보았습니다. checkpoint를 graph에 할당(`Graph.compile` 수행 시)하면 간단하게 구현할 수 있었습니다.
이번에는 여러 Thread를 운영 중일 때, 이를 어떻게 구현할 수 있는 지 살펴보겠습니다. 이런 상황이 필요한 단적인 예가 바로 "User ID" 관리일 것 입니다.
만약 회사의 사내 서비스 구현이라면 각 사원들의 인증 계정 정보(SSO)를 Cross-Thread로 관리할 수 있어야 하고, 이 때의 Persistence 구현이 바로 이러한 경우일 것입니다.

이러한 `Cross-Thread`관리가 필요한 정보의 Persistence는 Langgraph의 `Store` 객체를 활용해 구현합니다.

#### `InMemoryStore`

langgraph에서는 메모리에서 persistence가 필요한 정보를 들고 있고, 검색 가능하도록 `InMemoryStore`를 지원합니다.

```python
from langgraph.store.memory import InMemoryStore
from langchain_openai import OpenAIEmbeddings

in_memory_store = InMemoryStore(
    index={
        "embed": OpenAIEmbeddings(model="text-embedding-3-small"),
        "dims": 1536,
    }
)
```

그리고 정의된 `Store`객체를 `Graph.comile()`에 넘겨줍니다.

```python
# NOTE: we're passing the store object here when compiling the graph
graph = builder.compile(checkpointer=MemorySaver(), store=in_memory_store)
```

이 그래프가 정상 작동하기 위해선, 내부 Node에서 이 `InMemoryStore`에 정보를 저장(`.put`)하고 찾는(`.search`)는 과정이 구현되어 있으면 됩니다.

이러한 Node를 정의하고 `Graph.compile()`하는 과정은 아래와 같습니다.

```python
import uuid
from typing import Annotated
from typing_extensions import TypedDict

from langchain_anthropic import ChatAnthropic
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, MessagesState, START
from langgraph.checkpoint.memory import MemorySaver
from langgraph.store.base import BaseStore


model = ChatAnthropic(model="claude-3-5-sonnet-20240620")


# NOTE: we're passing the Store param to the node --
# this is the Store we compile the graph with
def call_model(state: MessagesState, config: RunnableConfig, *, store: BaseStore):

    ###########################################
    # 1. user_id 정의(config로 받기)
    # 2. `namespace` tuple 생성(memory 구분자)
    # 3. `namespace`로 기 저장된 persistence 정보 search
    # 4. 검색된 정보 > LLM prompting
    ###########################################
    user_id = config["configurable"]["user_id"]
    namespace = ("memories", user_id)
    memories = store.search(namespace, query=str(state["messages"][-1].content))
    
    info = "\n".join([d.value["data"] for d in memories])
    system_msg = f"You are a helpful assistant talking to the user. User info: {info}"

    # Store new memories if the user asks the model to remember
    last_message = state["messages"][-1]
    if "remember" in last_message.content.lower():
        memory = "User name is Bob"  # 또는 저장할 다른 정보. 예를 들면 `last_message.content`
        store.put(namespace, str(uuid.uuid4()), {"data": memory})

    response = model.invoke(
        [{"type": "system", "content": system_msg}] + state["messages"]
    )
    return {"messages": response}


builder = StateGraph(MessagesState)
builder.add_node("call_model", call_model)
builder.add_edge(START, "call_model")

# NOTE: we're passing the store object here when compiling the graph
graph = builder.compile(checkpointer=MemorySaver(), store=in_memory_store)
```

- 출처: [`langgraph` subgraph doc](https://langchain-ai.github.io/langgraph/how-tos/subgraph/#add-a-node-with-the-compiled-subgraph)

실제로 위 graph를 실행하면 아래와 같이 thread '1'과 '2' 사이에서 동일한 user id('1')에 대해 persistence가 구현된 것을 확인할수 있다.

```python
config = {"configurable": {"thread_id": "1", "user_id": "1"}}
input_message = {"type": "user", "content": "Hi! Remember: my name is Bob"}
for chunk in graph.stream({"messages": [input_message]}, config, stream_mode="values"):
    chunk["messages"][-1].pretty_print()
```

```bash
================================[1m Human Message [0m=================================

Hi! Remember: my name is Bob
==================================[1m Ai Message [0m==================================

Hello Bob! It's nice to meet you. I'll remember that your name is Bob. How can I assist you today?
```

```python
config = {"configurable": {"thread_id": "2", "user_id": "1"}}
input_message = {"type": "user", "content": "what is my name?"}
for chunk in graph.stream({"messages": [input_message]}, config, stream_mode="values"):
    chunk["messages"][-1].pretty_print()
```

```bash
================================[1m Human Message [0m=================================

what is my name?
==================================[1m Ai Message [0m==================================

Your name is Bob.
```

`InMemoryStore`에 저장된 정보는 아래와 같이 확인할 수 있다.

```python
for memory in in_memory_store.search(("memories", "1")):
    print(memory.value)
```
```bash
{'data': 'User name is Bob'}
```