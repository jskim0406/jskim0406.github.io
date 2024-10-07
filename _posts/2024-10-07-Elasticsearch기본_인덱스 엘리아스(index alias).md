---
layout: post
title: Elasticsearch - 인덱스 엘리아스(index alias)
author: jskim
featuredImage: null
img: null
tags: Elasticsearch, Retrieval
categories: Retrieval
date: '2024-10-07 00:25:00 +0900'
---

#### Reference
- https://github.com/nobaksan/fastcampus-elasticsearch-part1
- https://github.com/munkyu/fastcampus-es
- https://github.com/kkdeok/fastcampus-elasticsearch

#### 오늘의 API
```bash
# logs 엘리어스 추가
POST /_aliases
{
  "actions": [
    {
      "add": {
        "index": "logs-2024-10-01",
        "alias": "logs"
      }
    },
    {
      "add": {
        "index": "logs-2024-10-02",
        "alias": "logs"
      }
    }
  ]
}

# logs 엘리어스 추가
PUT logs-2024-10-01/_alias/logs

# logs 앨리어스를 사용한 데이터 검색
GET /logs/_search
{
  "query": {
    "match_all": {}
  }
}

# logs 엘리어스 제거
POST /_aliases
{
  "actions": [
    {
      "remove": {
        "index": "logs-2024-10-01",
        "alias": "logs"
      }
    }
  ]
}

# 데이터 마이그레이션: customer-data-v1의 데이터를 customer-data-v2로 복사
POST /_reindex
{
  "source": {
    "index": "customer-data-v1"
  },
  "dest": {
    "index": "customer-data-v2"
  }
}

# customer-data 앨리어스를 customer-data-v2로 변경
POST /_aliases
{
  "actions": [
    {
      "remove": {
        "index": "customer-data-v1",
        "alias": "customer-data"
      }
    },
    {
      "add": {
        "index": "customer-data-v2",
        "alias": "customer-data"
      }
    }
  ]
}
```
## 인덱스 엘리아스(alias)
Elasticsearch의 인덱스 앨리어스(alias)는 다음과 같은 주요 기능과 효과를 제공합니다.
1. **인덱스 명 추상화**: 앨리어스를 사용하면 특정 인덱스를 대신하는 이름을 설정할 수 있습니다. 이를 통해 클라이언트는 실제 인덱스 이름 대신 앨리어스 이름으로 접근할 수 있어, 인덱스 이름 변경이 필요할 때 클라이언트의 설정을 수정하지 않고도 대응할 수 있습니다.
2. **여러 인덱스에 대한 단일 접근**: 앨리어스를 여러 인덱스에 매핑하면, 마치 단일 인덱스처럼 사용 가능합니다. 이는 데이터가 여러 인덱스에 분산되어 있어도 하나의 이름으로 데이터를 조회하거나 검색할 수 있어 편리합니다.
3. **다운타임 없는 인덱스 교체**: 신규 인덱스를 생성한 후, 기존 앨리어스를 새 인덱스로 매핑하면 서비스의 중단 없이 인덱스를 전환할 수 있습니다. 예를 들어, 새로운 데이터 구조로 인덱스를 재설계한 뒤, 앨리어스를 업데이트하여 서비스 중단 없이 전환이 가능합니다.
4. **간편한 관리**: 인덱스 생성 시점에서 앨리어스를 설정하거나, 필요할 때`_alias API`를 사용해 추가, 삭제, 조회가 가능하여 인덱스와 앨리어스를 쉽게 관리할 수 있습니다. 예를 들어, PUT, DELETE 명령어를 사용하여 앨리어스를 추가하거나 삭제할 수 있으며, GET 명령어를 통해 앨리어스와 매핑된 인덱스 정보를 확인할 수 있습니다.
5. **동시 변경 처리**: 여러 인덱스에 대해 앨리어스를 추가하거나 삭제할 때, `POST _aliases` 명령어를 사용해 무중단으로 일괄 처리를 할 수 있습니다. 이는 한 번의 명령으로 여러 인덱스를 관리할 수 있어 효율적입니다.

`alias`는 별명을 붙이는 것과 유사합니다. 이를 통해 여러 인덱스를 마치 `grouping`하는 것과 유사한 효과를 얻을 수 있습니다. 더불어 신규 인덱스를 생성해 기존 인덱스에서 전환을 하고자 할 때에도, 신규-기존 인덱스 간 연결고리를 제공해 중단 없이 전환을 가능하게끔 해줍니다. 예시를 들어 조금 더 자세히 살펴보겠습니다.

### 인덱스 alias : "인덱스 grouping" 효과
#### 예시 1: 로그 데이터 관리
하루 마다 로그 데이터를 저장하는 인덱스를 생성한다고 가정해 보겠습니다. `logs-2024-10-01`, `logs-2024-10-02`, `logs-2024-10-03` 같은 인덱스를 생성합니다.
그런데 만약 특정 기간 동안의 데이터를 검색해야 한다면, 모든 개별 인덱스를 대상으로 쿼리를 보내야 하므로 불편할 수 있습니다.

이때 `logs`라는 앨리어스를 만들고, `logs-*` 패턴의 인덱스들에 이 앨리어스를 매핑하면, `logs`라는 이름으로 모든 로그 데이터를 한 번에 조회할 수 있습니다. 이렇게 `logs`라는 alias를 설정한 뒤, `GET logs/_search`와 같은 요청을 보내면, `logs-2024-10-01`, `logs-2024-10-02`, `logs-2024-10-03` 인덱스의 데이터를 모두 검색할 수 있습니다. 새로운 인덱스(`logs-2024-10-04`)가 생성되더라도 이 앨리어스에 추가하면, 클라이언트의 쿼리 수정 없이 자동으로 포함됩니다.

그럼 실제로 코드를 통해 확인해보겠습니다.
##### 예시 1: 로그 데이터 관리 - Elasticsearch 명령어 예시
###### 1. **하루마다 로그 인덱스 생성**
매일 새로운 로그 인덱스를 생성합니다. 각 인덱스는 특정 날짜의 데이터를 저장하는 역할을 합니다.
```bash
# 2024-10-01 로그 인덱스 생성
PUT /logs-2024-10-01
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      "timestamp": {
        "type": "date"
      },
      "message": {
        "type": "text"
      }
    }
  }
}

# 2024-10-02 로그 인덱스 생성
PUT /logs-2024-10-02
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      "timestamp": {
        "type": "date"
      },
      "message": {
        "type": "text"
      }
    }
  }
}
```
###### 2. **인덱스들을 앨리어스로 묶기**
이제 `logs`라는 앨리어스를 생성하고, 위에서 만든 두 개의 인덱스를 포함시킵니다. 이렇게 하면, `logs`라는 이름으로 두 인덱스의 데이터를 조회할 수 있습니다.
```bash
# logs-2024-10-01과 logs-2024-10-02를 logs라는 앨리어스에 추가
POST /_aliases
{
  "actions": [
    {
      "add": {
        "index": "logs-2024-10-01",
        "alias": "logs"
      }
    },
    {
      "add": {
        "index": "logs-2024-10-02",
        "alias": "logs"
      }
    }
  ]
}
```
###### 3. **앨리어스를 사용한 데이터 검색**
이제 `logs` 앨리어스를 사용하여, `logs-2024-10-01`과 `logs-2024-10-02` 인덱스의 데이터를 한 번에 조회할 수 있습니다.
```bash
# logs 앨리어스를 사용한 데이터 검색
GET /logs/_search
{
  "query": {
    "match_all": {}
  }
}
```
위 쿼리는 `logs` 앨리어스에 포함된 모든 인덱스의 데이터를 조회합니다. 즉, `logs-2024-10-01`과 `logs-2024-10-02`의 데이터가 모두 반환됩니다.
###### 4. **새로운 로그 인덱스를 추가하고 앨리어스 업데이트**
10월 3일자 로그를 위한 새로운 인덱스를 생성하고, 이를 `logs` 앨리어스에 추가합니다.
```bash
# 2024-10-03 로그 인덱스 생성
PUT /logs-2024-10-03
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      "timestamp": {
        "type": "date"
      },
      "message": {
        "type": "text"
      }
    }
  }
}

# logs-2024-10-03 인덱스를 logs 앨리어스에 추가
POST /_aliases
{
  "actions": [
    {
      "add": {
        "index": "logs-2024-10-03",
        "alias": "logs"
      }
    }
  ]
}
```
이제 `logs` 앨리어스는 `logs-2024-10-01`, `logs-2024-10-02`, `logs-2024-10-03` 인덱스를 모두 포함하게 되며, 동일한 `logs` 앨리어스를 통해 세 인덱스의 데이터를 한 번에 조회할 수 있습니다.
###### 5. **기존 인덱스 제거 후 앨리어스에서 제외**
만약 `logs-2024-10-01` 인덱스를 삭제하고 앨리어스에서 제거하고 싶다면 다음과 같이 처리합니다.
```bash
# logs-2024-10-01 인덱스를 logs 앨리어스에서 제거
POST /_aliases
{
  "actions": [
    {
      "remove": {
        "index": "logs-2024-10-01",
        "alias": "logs"
      }
    }
  ]
}

# logs-2024-10-01 인덱스 삭제
DELETE /logs-2024-10-01
```
##### 요약
- `PUT`: 인덱스를 생성합니다.
- `POST _aliases`: 인덱스를 앨리어스에 추가하거나 제거합니다.
- `GET`: 특정 앨리어스를 사용해 데이터를 조회합니다.
이를 통해 앨리어스를 활용한 여러 인덱스의 그룹 관리와 유연한 데이터 접근이 가능해집니다. 새로운 인덱스를 추가하거나 기존 인덱스를 제거할 때, 클라이언트 쿼리 수정 없이도 변경 사항이 반영됩니다.
##### N 개 이상의 index를 bulk로 한 번에 `alias`를 지정해야 하는 경우..?
`logs-2024-10-01`, `logs-2024-10-02`, `logs-2024-10-03` 총 3개의 인덱스를 `logs`라는 `alias`로 지정했습니다. 그런데 이러한 로그는 매일 발생합니다. 1년이면 총 365개의 인덱스가 존재할 것입니다. 그런데 위와 같이 `POST /_aliases`를 사용한다면 일일이 `add`를 작성해줘야 합니다. 이러한 경우 어떻게 `alias`를 설정하는 것이 좋을까요?

Elasticsearch에서는 앨리어스를 특정 패턴을 갖는 모든 인덱스에 자동으로 설정하는 기능은 기본적으로 제공되지 않습니다. 하지만, `logs-*`와 같은 패턴을 갖는 인덱스를 모두 대상으로 `logs`라는 앨리어스를 적용하려면, 다음과 같은 두 가지 방법을 사용할 수 있습니다:
###### 방법 1: 명시적으로 인덱스 리스트를 사용한 앨리어스 설정
Elasticsearch에서 `POST /_aliases` API를 사용할 때, 여러 인덱스에 대해 `add` 액션을 명시적으로 지정해야 합니다. 패턴으로 한 번에 모든 인덱스를 자동으로 선택할 수는 없지만, 다음과 같은 스크립트나 자동화 도구를 사용하여 이를 처리할 수 있습니다.

예를 들어, `logs-2024-10-*` 패턴을 가진 모든 인덱스를 `logs` 앨리어스로 설정하려면:
```bash
# POST /_aliases를 사용하여 여러 인덱스를 logs 앨리어스로 추가
POST /_aliases
{
  "actions": [
    {
      "add": {
        "index": "logs-2024-10-01",
        "alias": "logs"
      }
    },
    {
      "add": {
        "index": "logs-2024-10-02",
        "alias": "logs"
      }
    },
    {
      "add": {
        "index": "logs-2024-10-03",
        "alias": "logs"
      }
    }
    # 추가적인 인덱스들도 같은 방식으로 나열할 수 있습니다.
  ]
}
```
앞서 언급했던 것처럼 이 방법은 여러 인덱스를 한 번에 처리하지만, 명시적으로 모든 인덱스를 나열해야 하므로, 인덱스의 개수가 많아지면 관리가 어려워질 수 있습니다.
###### 방법 2: 스크립트 사용을 통한 자동화
만약 인덱스가 매우 많고, 매번 새로운 인덱스가 생성될 때 이를 자동으로 앨리어스에 추가하고 싶다면, 다음과 같은 스크립트를 작성하여 처리할 수 있습니다. 이 스크립트는 Elasticsearch의 `_cat/indices` API를 이용해 특정 패턴을 갖는 인덱스를 조회하고, 해당 인덱스들을 모두 `logs` 앨리어스에 추가하는 방법입니다.
```bash
# 모든 logs-2024-10-* 인덱스를 조회하여 logs 앨리어스에 추가하는 스크립트 예시 (Shell Script)
indices=$(curl -X GET "localhost:9200/_cat/indices/logs-2024-10-*?h=index" -s)

# JSON 형식으로 앨리어스를 설정할 데이터 구성
actions=""
for index in $indices; do
  actions="$actions{\"add\": {\"index\": \"$index\", \"alias\": \"logs\"}},"
done
# 끝의 쉼표를 제거하고 JSON 본문 구성
actions="{\"actions\": [${actions%,}]}"

# 앨리어스 업데이트 요청
curl -X POST "localhost:9200/_aliases" -H 'Content-Type: application/json' -d "$actions"
```

이 스크립트는 다음을 수행합니다:
1. `curl`을 사용하여 `logs-2024-10-*` 패턴을 가진 인덱스 목록을 가져옵니다.
2. 각 인덱스를 `logs`라는 앨리어스에 추가하는 JSON 본문을 생성합니다.
3. `POST /_aliases` API를 호출하여 모든 인덱스에 `logs` 앨리어스를 추가합니다.
##### 요약
- 기본적으로 Elasticsearch에서 `POST /_aliases` API는 와일드카드 패턴을 사용해 자동으로 여러 인덱스를 앨리어스에 추가하는 기능을 제공하지 않으므로, 개별 인덱스를 명시적으로 지정해야 합니다.
- 스크립트를 사용하여 자동화할 수 있으며, `GET _cat/indices` API와 함께 사용하면 특정 패턴의 인덱스를 쉽게 가져와 앨리어스를 설정할 수 있습니다.
- 이를 통해 매일 생성되는 인덱스를 `logs` 앨리어스에 추가하는 작업을 자동화하고, 일관된 데이터 접근을 유지할 수 있습니다.
이 방법들은 인덱스가 자주 생성되고, 이를 한 번에 관리하고자 할 때 유용합니다.

### 인덱스 alias : "다운타임 없는 인덱스 교체" 효과
예시 2의 데이터 마이그레이션과 무중단 서비스 시나리오를 실제 Elasticsearch 명령어를 사용해 단계별로 설명드리겠습니다. 이 과정에서는 기존 데이터를 새로운 인덱스로 이전하고, 앨리어스를 통해 클라이언트가 중단 없이 데이터를 조회할 수 있도록 하는 방법을 다룹니다.
#### 예시 2: 데이터 마이그레이션 및 무중단 서비스
기존에 고객 데이터를 `customer-data-v1`이라는 인덱스를 통해 관리하고 있었다고 가정해보겠습니다. 그런데 데이터 구조가 변경되어 새로운 데이터 구조를 적용한 `customer-data-v2` 인덱스를 생성하고 싶어졌습니다. 이때 중요한 것은 기존 데이터를 새로운 인덱스로 옮기는 과정에서 서비스 중단이 발생하지 않아야 한다는 점입니다. 고객이 데이터를 조회할 때, 이러한 변경 사항을 인지하지 못하고 지속적으로 데이터를 이용할 수 있어야 합니다.

이를 해결하기 위해, 먼저 `customer-data`라는 이름의 앨리어스를 설정하여, 이 앨리어스가 `customer-data-v1` 인덱스를 참조하도록 설정합니다. 이 상태에서 새로운 데이터 구조를 반영한 `customer-data-v2` 인덱스를 생성하고, 기존 `customer-data-v1`의 데이터를 `reindex` API를 이용해 `customer-data-v2`로 이전합니다. 데이터가 모두 이전되면, `customer-data` 앨리어스를 `customer-data-v2` 인덱스로 변경하여 클라이언트의 요청이 새로운 인덱스를 참조하도록 합니다.

이 방법의 효과는 클라이언트가 `customer-data`라는 이름을 사용해 데이터를 조회하기 때문에, 실제로 어떤 인덱스를 참조하는지 알 필요가 없다는 점입니다. 따라서 기존 인덱스에서 새로운 인덱스로의 데이터 마이그레이션이 진행되는 동안에도 서비스가 중단되지 않습니다. 이러한 방식을 통해 데이터 구조를 변경하거나 개선해야 할 때, 서비스의 중단 없이 안전하게 작업할 수 있습니다.

그럼 코드로 직접 그 과정을 살펴보겠습니다.
##### 예시 2: 데이터 마이그레이션 및 무중단 서비스 - Elasticsearch 명령어 예시
###### 1. **기존 인덱스 생성 및 초기 데이터 설정**
먼저, 기존의 인덱스인 `customer-data-v1`를 생성하고, `customer-data`라는 앨리어스를 매핑합니다.
```bash
# customer-data-v1 인덱스 생성
PUT /customer-data-v1
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      "name": {
        "type": "text"
      },
      "age": {
        "type": "integer"
      },
      "email": {
        "type": "keyword"
      }
    }
  }
}

# 기존 인덱스에 customer-data라는 앨리어스 추가
POST /_aliases
{
  "actions": [
    {
      "add": {
        "index": "customer-data-v1",
        "alias": "customer-data"
      }
    }
  ]
}
```
이렇게 하면, 클라이언트는 `customer-data`라는 이름으로 `customer-data-v1` 인덱스의 데이터를 조회할 수 있습니다.
###### 2. **새로운 인덱스 생성**
데이터 구조가 변경된 새로운 인덱스 `customer-data-v2`를 생성합니다. 이 인덱스는 새로운 데이터 구조를 반영한 것입니다.
```bash
# customer-data-v2 인덱스 생성 (변경된 데이터 구조)
PUT /customer-data-v2
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      "name": {
        "type": "text"
      },
      "age": {
        "type": "integer"
      },
      "email": {
        "type": "keyword"
      },
      "phone": {
        "type": "keyword"
      }  # 새롭게 추가된 필드
    }
  }
}
```
이 단계에서는 기존에 없었던 `phone` 필드가 새롭게 추가되었습니다. 이처럼 데이터 구조를 변경한 후 새로운 인덱스를 준비할 수 있습니다.
###### 3. **데이터를 v1에서 v2로 이전**
기존 `customer-data-v1` 인덱스의 데이터를 `customer-data-v2`로 옮깁니다. 이를 위해 `reindex` API를 사용할 수 있습니다.
```bash
# 데이터 마이그레이션: customer-data-v1의 데이터를 customer-data-v2로 복사
POST /_reindex
{
  "source": {
    "index": "customer-data-v1"
  },
  "dest": {
    "index": "customer-data-v2"
  }
}
```
이 명령은 `customer-data-v1` 인덱스의 데이터를 `customer-data-v2`로 복사합니다. 이 작업은 백그라운드에서 수행되므로, 클라이언트는 여전히 `customer-data`라는 이름으로 `customer-data-v1`의 데이터를 조회할 수 있습니다.
###### 4. **앨리어스를 새로운 인덱스로 변경**
데이터 마이그레이션이 완료되면, `customer-data`라는 앨리어스를 `customer-data-v2`로 변경합니다. 이를 위해 기존 인덱스와의 연결을 제거하고, 새 인덱스와 연결합니다.
```bash
# customer-data 앨리어스를 customer-data-v2로 변경
POST /_aliases
{
  "actions": [
    {
      "remove": {
        "index": "customer-data-v1",
        "alias": "customer-data"
      }
    },
    {
      "add": {
        "index": "customer-data-v2",
        "alias": "customer-data"
      }
    }
  ]
}
```
이 명령을 수행하면, `customer-data` 앨리어스는 `customer-data-v1`에서 `customer-data-v2`로 매핑이 변경됩니다. 이제 클라이언트가 `customer-data`를 조회하면, `customer-data-v2`의 데이터를 조회하게 됩니다.
###### 5. **기존 인덱스 삭제 (선택 사항)**
이제 `customer-data-v1` 인덱스는 더 이상 필요하지 않으므로 삭제할 수 있습니다.
```bash
# 기존의 customer-data-v1 인덱스 삭제
DELETE /customer-data-v1
```
##### 요약
1. `customer-data-v1` 인덱스를 생성하고 `customer-data`라는 앨리어스를 연결합니다.
2. 새로운 데이터 구조를 가진 `customer-data-v2` 인덱스를 생성합니다.
3. `reindex` API를 사용하여 데이터를 `v1`에서 `v2`로 이전합니다.
4. `customer-data` 앨리어스를 `v1`에서 `v2`로 변경하여 클라이언트가 서비스 중단 없이 새로운 인덱스를 사용하도록 합니다.
5. 필요시 `v1` 인덱스를 삭제하여 리소스를 정리합니다.
##### 효과
- 클라이언트는 `customer-data`라는 앨리어스를 사용하여 데이터에 접근하므로, 실제 인덱스의 변경을 인지할 필요가 없습니다.
- 데이터 구조가 변경된 새로운 인덱스로의 전환이 서비스 중단 없이 이루어집니다.
- 데이터 마이그레이션 과정 동안에도 `customer-data-v1`의 데이터가 여전히 서비스에 제공됩니다.
이런 방법을 사용하면 데이터 구조를 변경하거나 개선해야 할 때 서비스 중단 없이 안전하게 작업할 수 있습니다.