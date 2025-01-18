---
layout: post
title: langchain - `llm.bind_tools()`
author: jskim
featuredImage: null
img: null
tags: LLM, langchain, tool_calling
categories: LLM
date: '2025-01-18 01:25:00 +0900'
---

### Reference
- [`Tool` doc](https://api.python.langchain.com/en/latest/tools/langchain_core.tools.Tool.html#langchain_community.agent_toolkits.nla.tool.Tool)
- [`StructuredTool` doc](https://api.python.langchain.com/en/latest/tools/langchain_core.tools.StructuredTool.html#langchain_community.agent_toolkits.nla.tool.StructuredTool)
- [`ToolNode` doc](https://langchain-ai.github.io/langgraph/reference/prebuilt/#langgraph.prebuilt.tool_node.ToolNode)

### `llm.bind_tools()`
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

2. `ChatOpenAI.bind_tools(tools)`: 앞서 선언한 `tool`을 `llm`이 실행

추가로 langgraph를 구축하는 과정에서 `tool`을 실행 가능한 하나의 `node`로 정의하는 과정인 `ToolNode` 선언 과정도 포함되어 있다.
-  `ToolNode`: 선언된 `tool` 객체를 langgraph `Node`로 정의
	- [`ToolNode` doc](https://langchain-ai.github.io/langgraph/reference/prebuilt/#langgraph.prebuilt.tool_node.ToolNode)

### `bind_tools`
`bind_tools` 함수는 어떤 역할을 할까?

간단히 말하면 **LLM이 tool을 호출할 수 있도록 연결**하는 것입니다. LLM이 tool을 호출하기 위해서는 해당 tool의 정보(schema, description 등)가 필요한데, `bind_tools`는 이러한 정보들을 LLM이 이해할 수 있는 형태로 변환하여 연결해주는 역할을 한다.

크게 2가지 핵심 기능을 수행한다.

1. **Tool 정보 변환**: LLM이 이해할 수 있는 형태로 tool의 정보를 변환
   - Tool의 name, description을 활용해 언제 이 tool을 사용해야 하는지 판단할 수 있음
   - Tool의 args_schema를 활용해 어떤 입력이 필요한지 이해할 수 있게됨

2. **Tool 실행 연결**: LLM이 실제로 tool을 호출할 수 있도록 실행 환경을 연결
   - LLM이 tool을 호출하면 실제 Python 함수가 실행되도록 연결
   - Tool의 실행 결과를 LLM이 다시 받아볼 수 있도록 함

실제로 `bind_tools`가 적용된 후의 LLM은 아래와 같이 자동으로 tool을 인식하고 호출할 수 있게 된다.

```python
# bind_tools 적용 전
llm = ChatOpenAI(model="gpt-4o-mini")
response = llm.invoke("부산 날씨는 어때?")
print(response.content)  # 일반적인 텍스트 응답

# bind_tools 적용 후
llm_with_tools = ChatOpenAI(model="gpt-4o-mini").bind_tools(tools)
response = llm_with_tools.invoke("부산 날씨는 어때?")
print(response.tool_calls)  # tool 호출 정보를 포함한 응답
# [{'id': 'call_xxx', 'type': 'function', 'function': {'name': 'get_weather', 'arguments': '{"location": "부산"}'}}]
```

만약 `bind_tools` 없이 LLM에게 tool을 사용하게 하려면, 아래와 같이 복잡한 과정을 직접 구현해야 한다.

```python
# 1. Tool 정보를 프롬프트에 포함
prompt = """당신은 아래 함수를 사용할 수 있습니다:
함수명: get_weather
설명: Call to get the weather
인자: location (string)

위 함수를 활용해 다음 질문에 답하세요: 부산 날씨는 어때?
응답은 반드시 아래 JSON 형식으로 작성해주세요:
{
    "function": "함수명",
    "arguments": {
        "인자명": "값"
    }
}
"""

# 2. LLM 응답 파싱
response = llm.invoke(prompt)
try:
    tool_call = json.loads(response.content)
    func_name = tool_call["function"]
    arguments = tool_call["arguments"]
except json.JSONDecodeError:
    print("응답 파싱 실패")
    
# 3. 함수 실행
if func_name == "get_weather":
    result = get_weather(**arguments)
    
# 4. 결과를 LLM에게 전달하여 최종 응답 생성
final_prompt = f"""함수 실행 결과: {result}
이 결과를 바탕으로 자연스러운 답변을 작성해주세요."""
final_response = llm.invoke(final_prompt)
```

`bind_tools`를 사용하면 이러한 복잡한 과정(프롬프트 작성, 응답 파싱, 함수 실행, 결과 전달)을 자동화할 수 있으며, LLM이 더 자연스럽게 tool을 활용할 수 있게 된다.

1. **응답 파싱 자동화**: LLM의 응답을 자동으로 파싱하여 필요한 함수와 인자를 추출합니다.
2. **에러 처리**: 잘못된 형식의 응답이나 잘못된 인자가 전달되는 경우를 자동으로 처리합니다.
3. **함수 실행 자동화**: 파싱된 정보를 바탕으로 적절한 함수를 자동으로 실행합니다.
4. **결과 전달**: 함수 실행 결과를 LLM이 이해할 수 있는 형태로 자동 변환합니다.

