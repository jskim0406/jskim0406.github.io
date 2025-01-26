---
layout: post
title: langgraph - Persistence (3) other checkpointers
author: jskim
featuredImage: null
img: null
tags: LLM, langchain, langgraph, Persistence
categories: LLM
date: '2025-01-26 01:50:00 +0900'
---

### Reference
- [`langgraph` Persistence doc](https://langchain-ai.github.io/langgraph/concepts/persistence/)
- [`langgraph` How to use Postgres checkpointer for persistence](https://langchain-ai.github.io/langgraph/how-tos/persistence_postgres/)
- [`langgraph` How to use MongoDB checkpointer for persistence](https://langchain-ai.github.io/langgraph/how-tos/persistence_mongodb/)
- [`langgraph` How to create a custom checkpointer using Redis](https://langchain-ai.github.io/langgraph/how-tos/persistence_redis/) 
- with `claude`


## 다양한 형태의 Persistence 구현
langgraph에서 구현할 수 있는 graph의 형태는 매우 다양합니다. graph 형태에 관련없이 항상 `persistence`를 구현할 수 있어야 완결성 높은 라이브러리일 것입니다.

앞서 `thread_id`, `checkpoint_id`로 대표되는 config를 통해 Persistence를 구현하는 것을 볼 수 있었습니다.
- *[post "langgraph - Persistence(checkpoint, update state)"](https://jskim0406.github.io/posts/langgraph-persistence/)*

각 데이터베이스의 연결 방식별 특징과 적합한 사용 사례를 보완하여 다시 작성하겠습니다.

### 1. PostgreSQL을 활용한 Cross-Thread Persistence 구현

오픈소스 RDBMS중 하나인 `PostgreSQL`을 checkpointer로 사용하는 경우를 살펴보겠습니다.

연결 방식은 크게 세 가지를 지원하며, 각각의 방식은 다른 사용 사례에 최적화되어 있습니다.

1. **Connection Pool 활용**
```python
from psycopg_pool import ConnectionPool

with ConnectionPool(
    conninfo=DB_URI,
    max_size=20,
    kwargs={"autocommit": True, "prepare_threshold": 0}
) as pool:
    checkpointer = PostgresSaver(pool)
    checkpointer.setup()  # 최초 1회만 실행
    
    graph = create_react_agent(model, tools=tools, checkpointer=checkpointer)
```

Connection Pool 방식은 다수의 사용자가 동시에 접속하는 웹 애플리케이션에 가장 적합합니다. 데이터베이스 연결을 미리 생성하여 pool에서 관리하므로, 연결 생성/해제의 오버헤드를 줄일 수 있고 동시성(Concurrency) 처리에 효과적입니다. 예를 들어, 채팅 서비스에서 여러 사용자의 메시지를 동시에 처리할 때 이상적입니다.

2. **단일 Connection 활용**
```python
from psycopg import Connection

with Connection.connect(DB_URI, **connection_kwargs) as conn:
    checkpointer = PostgresSaver(conn)
    graph = create_react_agent(model, tools=tools, checkpointer=checkpointer)
```

단일 Connection 방식은 배치 작업이나 관리자 도구와 같이 장시간 동안 하나의 데이터베이스 연결만 필요한 경우에 적합합니다. 트랜잭션 관리가 간단하고 리소스 사용이 예측 가능하다는 장점이 있습니다. 예를 들어, 야간에 실행되는 데이터 분석 작업에 적절합니다.

3. **Connection String 활용**
```python
with PostgresSaver.from_conn_string(DB_URI) as checkpointer:
    graph = create_react_agent(model, tools=tools, checkpointer=checkpointer)
```

Connection String 방식은 가장 간단한 연결 방식으로, 개발 단계나 프로토타입 제작 시에 적합합니다. 설정이 단순하고 직관적이며, 연결 정보를 환경 변수나 설정 파일로 쉽게 관리할 수 있습니다. 특히 개발자가 로컬 환경에서 테스트할 때 유용합니다.

4. **Async 지원**
고성능 어플리케이션을 위해 PostgreSQL은 비동기(async) 연결도 지원합니다.

```python
from psycopg_pool import AsyncConnectionPool

async with AsyncConnectionPool(
    conninfo=DB_URI,
    max_size=20,
    kwargs=connection_kwargs,
) as pool:
    checkpointer = AsyncPostgresSaver(pool)
    await checkpointer.setup()
    
    graph = create_react_agent(model, tools=tools, checkpointer=checkpointer)
    config = {"configurable": {"thread_id": "4"}}
    res = await graph.ainvoke(
        {"messages": [("human", "what's the weather in nyc")]}, 
        config
    )
```

### 2. MongoDB를 활용한 Cross-Thread Persistence 구현

대표적인 NoSQL 데이터베이스인 MongoDB를 활용한 persistence 구현 방법을 살펴보겠습니다. MongoDB는 문서 지향(Document-Oriented) 데이터베이스로, LLM 응답과 같은 비정형 데이터를 저장하기에 적합합니다.

연결 방식은 크게 두 가지를 지원합니다.

- **MongoDB Checkpointer 구현**
```python
from langgraph.checkpoint.mongodb import MongoDBSaver

MONGODB_URI = "mongodb://localhost:27017"
```

1. **Connection String 활용**
```python
with MongoDBSaver.from_conn_string(MONGODB_URI) as checkpointer:
    graph = create_react_agent(model, tools=tools, checkpointer=checkpointer)
```

Connection String 방식은 단순하고 직관적인 설정이 필요한 경우에 적합합니다. MongoDB Atlas와 같은 클라우드 서비스를 사용할 때 제공되는 connection string을 그대로 사용할 수 있어 편리합니다.

2. **MongoDB Client 활용**
```python
from pymongo import MongoClient

mongodb_client = MongoClient(MONGODB_URI)
checkpointer = MongoDBSaver(mongodb_client)
```

MongoDB Client 방식은 더 세밀한 제어가 필요한 프로덕션 환경에 적합합니다. 커넥션 풀링, 타임아웃 설정, 인증 옵션 등을 상세하게 구성할 수 있어, 대규모 시스템에서 안정적인 운영이 가능합니다.