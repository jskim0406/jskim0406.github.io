---
layout: post
title: Elasticsearch - 매핑과 분석기(동적 매핑과 정적 매핑)
author: jskim
featuredImage: null
img: null
tags: Elasticsearch, Retrieval
categories: Retrieval
date: '2024-09-03 00:25:00 +0900'
---

#### Reference
- https://github.com/nobaksan/fastcampus-elasticsearch-part1
- https://github.com/munkyu/fastcampus-es
- https://github.com/kkdeok/fastcampus-elasticsearch

#### 오늘의 API
```plaintext
# 동적 매핑
PUT car-master.dynamic.v2
{
	"mappings": {
		"dynamic": "strict"
	}
}

POST car-master.dynamic.v2/_mapping
{
  "dynamic": "true"
}

# 정적 매핑
PUT car-master.static
{
  "mappings":{
    "properties": {
      "brand": {
        "type": "keyword"
      }
    }
  }
}

PUT car-master.static/_mapping
{
  "properties": {
    "brand": {
      "type": "keyword"
    }
  }
}
```

### Elasticsearch에서의 매핑 이해
Elasticsearch에서 매핑이란 관계형 데이터베이스의 스키마와 유사한 역할을 수행합니다. 매핑을 통해 Elasticsearch의 각 인덱스에 저장되는 데이터의 구조 —즉 데이터의 필드 이름과 데이터 타입— 를 정의합니다. 매핑을 사전에 정의하지 않을 경우, Elasticsearch는 동적 매핑 기능을 통해 자동으로 데이터 유형을 추론하고 인덱스에 새 필드를 추가합니다. 하지만, 보다 정확한 데이터 구조를 위해 정적 매핑을 사용하여 인덱스에 추가되는 데이터의 유형을 미리 정의할 수 있습니다.

### 동적 매핑
#### 동적 매핑의 역할과 설정
동적 매핑은 문서를 색인할 때 각 필드의 이름과 유형을 사전에 설정할 필요 없이 자동으로 구성하는 기능입니다. 이는 데이터 입력 과정을 간소화하며, 새로운 데이터 유형이 추가될 때 즉각적으로 필드를 인덱스에 추가할 수 있게 합니다. 

그러나, 이러한 자동화된 과정은 때로 데이터 유형의 오류로 인해 검색 에러를 발생시킬 위험도 있습니다. 예를 들어, 날짜 타입이 잘못 지정되어 필요한 검색 결과를 제공하지 못할 수 있습니다. 이러한 문제를 해결하기 위해 Elasticsearch는 동적 매핑 규칙을 사용자가 직접 구성할 수 있게 하여, 동적 필드 매핑 또는 동적 템플릿을 통해 필요에 맞게 매핑을 조정할 수 있습니다.

#### 동적 매핑 설정 옵션
동적 매핑을 설정할 때 사용할 수 있는 `dynamic` 파라미터에는 다음과 같은 옵션이 있습니다:


| **옵션**              | **설명**                                                                                                                            |
| --------------------- |:----------------------------------------------------------------------------------------------------------------------------------- |
| **true** <br>(기본값) | 새로운 필드가 발견되면 자동으로 매핑에 추가합니다. 이는 새로운 데이터 유형을 자동으로 인식하고 색인하는 데 유용합니다.              |
| **runtime**           | 새로운 필드를 매핑에 런타임 필드로 추가합니다. 이 필드는 색인되지 않지만, 문서의 `_source` 필드에서 조회할 때 로드됩니다.           |
| **false**             | 새로운 필드는 무시되고 매핑에 추가되지 않습니다. 이 필드는 색인되거나 검색할 수 없으나, `_source` 필드에서는 확인할 수 있습니다.    |
| **strict**            | 새로운 필드가 감지되면 예외를 발생시키고 해당 문서는 색인되지 않습니다. 이 설정은 매우 엄격하게 필드를 관리하고자 할 때 사용됩니다. |


이러한 설정을 통해 사용자는 Elasticsearch 인덱스의 구조를 보다 세밀하게 제어할 수 있으며, 데이터의 정확성과 검색의 효율성을 높일 수 있습니다. 데이터 관리 전략에 따라 적절한 동적 매핑 옵션을 선택하는 것이 중요합니다.

#### 동적 매핑 예시(`dynamic` 옵션)
아래와 같이 `car-master.dynamic.v2`라는 인덱스를 `동적 매핑`으로 생성해보겠습니다.
```plaintext
PUT car-master.dynamic.v2
{
	"mappings": {
		"dynamic": "strict"
	}
}
```

위와 같이 `dynamic` 옵션을 `strict`로 줄 경우, 새로운 필드가 감지되면 예외를 발생시키고 인덱스 생성을 하지 않습니다. 말 그대로 가장 엄격합니다. 위 dynamic 옵션을 준 상태에서 새로 문서를 추가해보겠습니다.
```plaintext
PUT car-master.dynamic.v2/_doc/1
{
  "brand": "현대"
}
```

1번 문서에 대해 "brand"라는 필드의 값으로 "현대"를 추가해보았습니다. "brand"의 매핑 property는 동적 mapping으로 지정된 상태입니다. dynamic 옵션은 strict이며, 이 옵션은 매우 엄격하게 필드를 관리합니다.
역시나 실행 결과, 새 문서에 대해 인덱스가 되지 않았습니다.
```plaintext
{
  "error": {
    "root_cause": [
      {
        "type": "strict_dynamic_mapping_exception",
        "reason": "[2:12] mapping set to strict, dynamic introduction of [brand] within [_doc] is not allowed"
      }
    ],
    "type": "strict_dynamic_mapping_exception",
    "reason": "[2:12] mapping set to strict, dynamic introduction of [brand] within [_doc] is not allowed"
  },
  "status": 400
}
```

위와 같이 `"strict_dynamic_mapping_exception"`을 확인할 수 있습니다.

이번에는 `dynamic`옵션을 기본 값인 `true`로 주겠습니다. 이 경우 말 그대로 새 문서가 들어오면 자동으로 동적 매핑을 수행해 인덱스를 생성합니다.
```plaintext
POST car-master.dynamic.v2/_mapping
{
  "dynamic": "true"
}
```

그 다음 다시 새로운 문서를 추가해보겠습니다.
```plaintext
PUT car-master.dynamic.v2/_doc/1
{
  "brand": "현대"
}
```

그 결과 아래와 같이 이번에는 동적으로 잘 매핑된 것을 볼 수 있습니다.
이처럼 같은 동적 매핑이라도 `dynamic` 옵션을 어떻게 주느냐에 따라 인덱스 생성이 다를 수 있습니다.
```plaintext
{
  "_index": "car-master.dynamic.v2",
  "_id": "1",
  "_version": 1,
  "result": "created",
  "_shards": {
    "total": 2,
    "successful": 1,
    "failed": 0
  },
  "_seq_no": 0,
  "_primary_term": 1
}
```

### 정적 매핑
#### 정적 매핑의 역할과 설정
정적 매핑은 문서에 저장할 데이터의 종류를 미리 알고 있어 인덱스를 생성할 때 필드와 유형을 사전에 정의하는 방식을 의미합니다.
정의된 필드를 삭제하거나 데이터 필드 유형을 실시간으로 변경하는 것은 불가능합니다.
보다 정확한 데이터 구조를 위해 정적 매핑을 사용하여 인덱스에 추가되는 데이터의 유형을 미리 정의하는 것이 가능하면 좋은 접근 방법이라고 볼 수  있습니다.

#### 정적 매핑 예시
정적 매핑은 아래와 같이 직접 mapping property를 설정해주는 방식으로 진행됩니다.
```plaintext
PUT car-master.static
{
  "mappings":{
    "properties": {
      "brand": {
        "type": "keyword"
      }
    }
  }
}
```

그럼 아래와 같이 인덱스가 생성된 것을 볼 수 있습니다.
```plaintext
GET car-master.static/_mapping

# 결과
{
  "car-master.static": {
    "mappings": {
      "properties": {
        "brand": {
          "type": "keyword"
        }
      }
    }
  }
}
```

이는 동적 매핑을 수행했을 때와 명확히 다른 결과입니다.
동적으로 매핑했던 인덱스 mapping 결과는 아래와 같습니다.
```plaintext
POST car-master.dynamic.v2/_mapping
{
  "dynamic": "true"
}

PUT car-master.dynamic.v2/_doc/1
{
  "brand": "현대"
}

GET car-master.dynamic.v2/_mapping

# 결과
{
  "car-master.dynamic.v2": {
    "mappings": {
      "dynamic": "true",
      "properties": {
        "brand": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        }
      }
    }
  }
}
```

`GET car-master.dynamic.v2/_mapping` 로 동적 mapping 결과를 조회하니, `brand`의 type이 `text`로 지정되었습니다. 정적 mapping으로 지정한 `keyword` type과는 역시 다르게 지정된 것을 볼 수 있습니다.