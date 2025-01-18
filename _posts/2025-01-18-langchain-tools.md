---
layout: post
title: langchain - `@tool`
author: jskim
featuredImage: null
img: null
tags: LLM, langchain, tool_calling
categories: LLM
date: '2025-01-18 00:25:00 +0900'
---

### Reference
- [`Tool` doc](https://api.python.langchain.com/en/latest/tools/langchain_core.tools.Tool.html#langchain_community.agent_toolkits.nla.tool.Tool)
- [`StructuredTool` doc](https://api.python.langchain.com/en/latest/tools/langchain_core.tools.StructuredTool.html#langchain_community.agent_toolkits.nla.tool.StructuredTool)
- [`ToolNode` doc](https://langchain-ai.github.io/langgraph/reference/prebuilt/#langgraph.prebuilt.tool_node.ToolNode)

### `@tool`
```python
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import ToolNode

@tool
def get_weather(location:str):
	"""Call to get the weather"""
	if location in ["서울", "인천"]:
		return "수도권은 13도이며, 안개가 짙습니다."
	else:
		return "수도권 외 지역은 15도이며, 화창합니다."

tools = [get_weather]
tool_node = ToolNode(tools)

llm_with_tools = ChatOpenAI(model="gpt-4o-mini").bind_tools(tools)
result_toolcall = llm_with_tools.invoke("부산 날씨는 어때?").tool_calls
```

위 코드는 크게 아래 2가지를 수행하는 샘플 코드이다.

1. `@tool`: 파이썬 함수 `get_weather`를 langchain의 `tool`객체로 변환하고,
	- langchain `tool`객체: `langchain_core.tools.StructuredTool`(Langchain `BaseTool` 상속)
	- [`Tool` doc](https://api.python.langchain.com/en/latest/tools/langchain_core.tools.Tool.html#langchain_community.agent_toolkits.nla.tool.Tool)
	- [`StructuredTool` doc](https://api.python.langchain.com/en/latest/tools/langchain_core.tools.StructuredTool.html#langchain_community.agent_toolkits.nla.tool.StructuredTool)

2. `ChatOpenAI.bind_tools(tools)`: 앞서 선언한 `tool`을 `llm`이 실행할 수 있도록 tool을 llm에 연결하는(`harnessing`) 과정

추가로 langgraph를 구축하는 과정에서 `tool`을 실행 가능한 하나의 `node`로 정의하는 과정인 `ToolNode` 선언 과정도 포함되어 있다.
-  `ToolNode`: 선언된 `tool` 객체를 langgraph `Node`로 정의
	- [`ToolNode` doc](https://langchain-ai.github.io/langgraph/reference/prebuilt/#langgraph.prebuilt.tool_node.ToolNode)

### `@tool`
`@tool` 데코레이터는 무슨 역할을 할까?
간단히 말하면 **python 함수**를 **langchain의 tool 객체**로 변환하는 것이다.

크게 2가지가 이 객체에 저장되는 데, **1) Pydantic schema**, **2) Function tool**, **3) function description** 이 객체에 담기게 된다.

이를 통해 추후 LLM은 이 3가지 정보를 바탕으로 아래와 같은 내용을 판단해 **tool_calling**을 수행하게 된다.

- 언제 사용해야 하는지 (description을 통해)
- 어떤 입력이 필요한지 (schema를 통해)
- 어떤 결과를 기대할 수 있는지 (function을 통해)

본질적인 기능은 '함수'라는 점에서 본질적인 기능 변화는 없다. 다만 langchain 라이브러리의 객체로 정의함으로써, LLM이 **tool_calling** 을 수행하기 위해 필요한 정보를 하나의 객체에 담아놓는 integration 과정 정도로 이해할 수 있다.

실제로 langchain 객체인 `tool`로 정의되면 아래와 같은 형태의 instance가 된다.

```bash
tools

>> [StructuredTool(name='get_weather', description='Call to get the weather', args_schema=<class 'langchain_core.utils.pydantic.get_weather'>, func=<function get_weather at 0x12fb04d60>)]
```

함수의`description`, Pydantic Schema(`Pydantic.get_weather`), Inner Function(`<function get_weather at 0x12fb04d60>`)이 `StructureTool`이라는 객체에 담기는 것을 확인할 수 있다.

langchain library는 data의 schema를 pydantic을 활용해 정의하는 모습을 볼 수 있으며, 이는 아래와 같은 결과로 확인할 수 있다. 이 때 pydatnic 클래스 이름은 함수 명이었던 `get_weather`로 정의되는 것을 확인할 수 있다. 더불어 `title`도 함수 명(`get_weather`)가 그대로 활용되며, LLM이 이 tool을 호출할 때의 식별자로 활용된다. 따라서 `@tool`로 데코레이팅 할 함수의 이름을 나름 성의있게 정의할 필요가 있다.

```bash
tools[0].args_schema.model_json_schema
>> <bound method BaseModel.model_json_schema of <class 'langchain_core.utils.pydantic.get_weather'>>

tools[0].args_schema.model_json_schema()
>> {'description': 'Call to get the weather', 'properties': {'location': {'title': 'Location', 'type': 'string'}, 'config': {'default': None, 'title': 'Config'}}, 'required': ['location'], 'title': 'get_weather', 'type': 'object'}

tools[0].args_schema.__annotations__
>> {'location': <class 'str'>, 'config': typing.Any}

tools[0].args_schema.model_fields
>> {'location': FieldInfo(annotation=str, required=True), 'config': FieldInfo(annotation=Any, required=False, default=None)}
```

만약 역으로 이처럼 langchain의 `@tool` 데코레이터 없이, llm에게 tool_calling할 수 있는 `Tool` 객체로 정의 하려면 아래와 같은 과정을 거쳐야 한다.

**1) Pydantic schema**, **2) Function tool**, **3) function description**

위 3가지 정보를 직접 정의한 뒤, `Tool`객체로 직접 정의해줘야 한다.

```python
from langchain_core.tools import Tool
from pydantic import BaseModel
from typing import Any

# 1. Pydantic 스키마 정의
class get_weather(BaseModel):
    """Call to get the weather"""
    location: str
    config: Any | None = None

# 2. 실제 실행될 함수 정의
def get_weather_func(location: str) -> str:
    if location in ["서울", "인천"]:
        return "수도권은 13도이며, 안개가 짙습니다."
    else:
        return "수도권 외 지역은 15도이며, 화창합니다."

# 3. Tool 인스턴스 생성
weather_tool = Tool(
    name="get_weather",
    description="Call to get the weather",
    func=get_weather_func,
    args_schema=get_weather
)

# 4. LLM에 도구 바인딩
tools = [weather_tool]
llm_with_tools = ChatOpenAI(model="gpt-4o-mini").bind_tools(tools)
```