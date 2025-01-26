---
layout: post
title: langgraph - Super-step, PregelTask
author: jskim
featuredImage: null
img: null
tags: LLM, langchain, langgraph, Persistence, Super-step, PregelTask
categories: LLM
date: '2025-01-26 01:25:00 +0900'
---

### Reference
- [`langgraph` Persistence doc](https://langchain-ai.github.io/langgraph/concepts/persistence/)
- with `claude`

langgraph의 `Persistence`를 살펴보던 중, `Super-step`과 `PregelTask`라는 개념이 등장합니다.
- [*post "langgraph - Persistence"*]()

이 2가지 개념은 langgraph 구성의 기본적인 실행 단위들로, 확실하게 이해하고 넘어가는 것이 좋을 것 같아 정리를 해보고자 합니다.

LangGraph 문서에서 언급되는 **Super-step**과 **PregelTask**는 LangGraph의 실행 방식과 체크포인트 기능을 이해하는 데 중요한 개념입니다.

#### Prerequisite 1) `Super-step`

`Super-step`은 LangGraph에서 **그래프 실행의 단계를 나타내는 논리적인 단위**입니다. Persistence를 위해 관리하는 **체크포인트 생성의 기준** 이라는 점이 가장 중요한 점입니다.
Langgraph는 각 `Super-step`을 체크포인트로 관리합니다.

`Super-step`의 역할을 살펴보면

1. **체크포인트 생성 단위:** LangGraph는 **각 Super-step이 끝날 때마다** 그래프의 상태를 체크포인트로 저장합니다. 즉, Super-step은 체크포인트 생성의 기준이 됩니다.
2. **실행 흐름 관리:** LangGraph는 Super-step 단위로 그래프를 진행하며, 다음 Super-step에서 실행할 노드들을 결정합니다.
3. **병렬 처리 가능성:**  Super-step 내에서 여러 노드가 병렬적으로 실행될 수 있습니다 (구현 방식에 따라 다름).

Super-step을 **마라톤의 구간** 이라고 생각하면 이해하기 쉬울 수 있습니다.

* 마라톤은 여러 구간으로 나뉘어져 있고, 각 구간을 완료할 때마다 체크포인트를 찍습니다.
* 각 구간 내에서 여러 선수(노드)들이 달릴 수 있습니다 (병렬 처리).
* 다음 구간은 이전 구간의 결과를 바탕으로 결정됩니다 (실행 흐름 관리).

간단한 예시를 들어보면,

```markdown
A -> (B, C) -> D
```

이런 그래프가 있다고 가정해보면, 아래와 같은 3개의 Super-step을 갖습니다.

슈퍼스텝 1: A 노드 실행
슈퍼스텝 2: B와 C 노드가 병렬로 실행 (같은 슈퍼스텝에서 실행됨)
슈퍼스텝 3: D 노드 실행

#### Prerequisite 2) `PregelTask`

`PregelTask`는 Super-step 내에서 **개별 노드의 실행 단위** 를 나타냅니다. 즉, Super-step은 여러 개의 PregelTask로 구성될 수 있습니다.

그 역할은 아래와 같습니다.

1. **노드 실행 정보 기록:** PregelTask는 특정 노드가 언제, 어떻게 실행되었는지에 대한 정보를 담고 있습니다.
2. **체크포인트에 포함:** 체크포인트에는 실행된 PregelTask 목록이 포함되어, 그래프 실행 과정을 추적하고 재현하는 데 사용됩니다.
3. **재실행 및 오류 처리:**  체크포인트를 통해 그래프를 재실행하거나 오류가 발생했을 때, PregelTask 정보를 활용하여 이미 완료된 노드를 건너뛰고 다음 단계를 진행할 수 있습니다.

* **'Pregel' 단어의 유래:** "Pregel"은 Google에서 개발한 대규모 그래프 처리 프레임워크 이름입니다. LangGraph의 PregelTask는 이 프레임워크의 개념을 일부 차용한 것으로 보입니다. (하지만 LangGraph가 Pregel 프레임워크 자체를 사용하는 것은 아닙니다.)

* **PregelTask 객체의 정보:** 문서에 따르면 `PregelTask` 객체는 다음 정보를 포함합니다.
    * `id`: PregelTask의 고유 ID
    * `name`: 실행된 노드의 이름
    * `step`: Super-step 번호 (몇 번째 Super-step에서 실행되었는지)
    * (추가적으로) 노드 실행이 중단된 경우, 중단 관련 정보

실제로 아래와 같이 한 `super-step`의 스냅샷을 살펴보면, 해당 `super-step`에서 수행된 `PregelTask`가 아래와 같이 기록됩니다.

```python
StateSnapshot(
    values={'foo': 'a', 'bar': ['a']}, 
    next=('node_b',),
    metadata={'step': 1},
    tasks=(
        PregelTask(
            id='6fb7314f-f114-5413-a1f3-d37dfe98ff44',
            name='node_b',
            error=None,
            interrupts=()
        ),
    )
)
```

**Super-step과 PregelTask의 관계**

* **Super-step은 컨테이너, PregelTask는 내용물:** Super-step은 그래프 실행의 큰 단계를 나타내고, PregelTask는 그 Super-step 안에서 실행된 개별 노드들의 실행 기록입니다.
* **체크포인트는 Super-step 단위로 생성, PregelTask 정보 포함:** 체크포인트는 각 Super-step이 끝날 때 생성되며, 그 Super-step에서 실행된 PregelTask들의 정보를 함께 저장합니다.
* **실행 흐름 추적 및 재현:** Super-step과 PregelTask 정보 덕분에 LangGraph는 그래프 실행 과정을 정확하게 추적하고, 체크포인트를 통해 특정 시점부터 실행을 재개하거나 이전 실행을 재현할 수 있습니다.

**왜 Super-step과 PregelTask가 중요한가? (Persistence 관점에서)**

* **체크포인트의 핵심 구성 요소:** Super-step과 PregelTask는 LangGraph의 체크포인트 기능의 핵심 구성 요소입니다. 이 정보들이 체크포인트에 저장되어야 그래프 상태를 정확하게 복원하고 실행을 재개할 수 있습니다.
* **Time Travel, Fault-tolerance 기능 구현:**  Super-step과 PregelTask 정보는 Time Travel (과거 시점으로 되돌아가기) 및 Fault-tolerance (오류 발생 시 복구) 기능을 가능하게 해줍니다.  체크포인트를 통해 특정 Super-step부터 재실행하거나, 오류 발생 직전 Super-step으로 돌아가 다시 시도할 수 있습니다.
* **Human-in-the-loop 워크플로우 지원:** Super-step 단위로 체크포인트를 생성하고, PregelTask 정보를 통해 실행 과정을 파악할 수 있기 때문에, 사람이 개입하여 그래프 실행을 검토하고 제어하는 Human-in-the-loop 워크플로우를 효과적으로 지원할 수 있습니다.

**정리**

| 개념        | 설명                                                                 | 역할                                                                                                | 체크포인트 관련성                                                                                                  | 비유                                    |
| ----------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| **Super-step** | 그래프 실행의 단계, 논리적 단위                                              | 체크포인트 생성 단위, 실행 흐름 관리, 병렬 처리 가능성                                                                 | 각 Super-step 종료 시 체크포인트 생성                                                                                      | 마라톤 구간                               |
| **PregelTask** | Super-step 내 개별 노드 실행 단위                                             | 노드 실행 정보 기록, 체크포인트 포함, 재실행 및 오류 처리                                                               | 체크포인트에 PregelTask 목록 포함                                                                                         | 마라톤 선수 (각 구간 내에서 달리는 선수) |

Super-step과 PregelTask는 LangGraph의 실행 방식과 Persistence 기능을 이해하는 데 중요한 용어입니다. 이 개념들을 이해하면 LangGraph의 고급 기능들을 더욱 효과적으로 활용할 수 있을 것입니다.