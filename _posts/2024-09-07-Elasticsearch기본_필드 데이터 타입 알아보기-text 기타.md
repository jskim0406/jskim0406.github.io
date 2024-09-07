---
layout: post
title: Elasticsearch - 필드 데이터 타입 알아보기 - `match_only_text`, `search_as_you_type`
author: jskim
featuredImage: null
img: null
tags: Elasticsearch, Retrieval
categories: Retrieval
date: '2024-09-07 00:25:00 +0900'
---

#### Reference
- https://github.com/nobaksan/fastcampus-elasticsearch-part1
- https://github.com/munkyu/fastcampus-es
- https://github.com/kkdeok/fastcampus-elasticsearch

#### 오늘의 API
```plaintext
PUT car-master.static.match_only_text
{
	"mappings": {
		"properties": {
			"region": {
				"type": "match_only_text"
			}
		}
	}
}

PUT car-master.static.search_as_you_type
{
	"mappings": {
		"properties": {
			"region": {
				"type": "search_as_you_type"
			}
		}
	}
}

PUT /books
{
  "mappings": {
    "properties": {
      "title": {
        "type": "search_as_you_type"
      }
    }
  }
}

POST /books/_search
{
  "query": {
    "multi_match": {
      "query": "Har",
      "type": "bool_prefix",
      "fields": [
        "title",
        "title._2gram",
        "title._3gram"
      ]
    }
  }
}

PUT /books
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "fields": {
          "autocomplete": {
            "type": "search_as_you_type"
          }
        }
      }
    }
  }
}

POST /books/_search
{
  "query": {
    "multi_match": {
      "query": "Har",
      "type": "bool_prefix",
      "fields": [
        "title.autocomplete",
        "title.autocomplete._2gram",
        "title.autocomplete._3gram"
      ]
    }
  }
}
```

## 필드 데이터 타입 종류
Elasticsearch에 사용되는 필드 데이터 타입은 크게 3가지로 나뉠 수 있습니다.
1. 지형 데이터 타입
	- `geo_point`
	- `geo_shape`
2. 계층 구조 데이터 타입
	- `Object`
	- `Nested`
3. 일반 데이터 타입
	- `keyword`, `text`
	- `date`
	- `long`, `double`, `integer`, ..
	- `boolean`, `ip`
각각의 데이터 타입은 모두 저마다의 특징을 갖고 있습니다. 데이터 저장 시 적절한 타입으로 mapping해주는 것이 필요합니다.
아래에서 필드 데이터 타입 중 **문자열 데이터 타입 유형**에 대해 먼저 살펴보겠습니다.

## 문자열 데이터 타입 유형
- 문자열은 `keyword`, `text` 타입으로 보통 매핑됩니다. 색인 전에 각 데이터 별로 이러한 매핑 타입을 사전에 정의해놓고, 정적 매핑으로 색인을 진행하는 것이 필요합니다.
	- 정적 매핑이 색인 과정에서 쓰기 작업에 필요한 공간을 절약하고, 쓰기 속도를 높일 수 있기 때문입니다.
### 문자열 데이터 타입 유형 (5) `match_only_text`
```plaintext
PUT car-master.static.match_only_text
{
	"mappings": {
		"properties": {
			"region": {
				"type": "match_only_text"
			}
		}
	}
}
```
##### `match_only_text` 필드 타입
Elasticsearch에서 데이터를 효율적으로 색인하고 검색하는 방법에는 여러 가지가 있습니다. 특히 로그 분석과 같이 대량의 텍스트 데이터를 처리할 때, 리소스 효율성은 매우 중요한 요소입니다. 이런 상황에서 `match_only_text` 필드 타입은 매우 유용한 선택지가 될 수 있습니다. 이 필드 타입은 일반 `text` 필드와 `keyword` 필드 사이의 중간 단계로서, 디스크 공간을 절약하면서도 효과적인 검색 기능을 제공합니다.

###### **디스크 공간 절약**
`match_only_text` 필드 타입은 일반 `text` 필드 타입에 비해 약 10%의 디스크 공간을 절약합니다. 이는 특히 대용량 로그 데이터를 처리할 때 중요한 이점으로, 시스템의 전반적인 효율성을 높이는 데 도움이 됩니다.

###### **검색 성능 최적화**
이 필드 타입은 전체 텍스트 쿼리를 실행할 수 있지만, 검색 결과에 관련 점수를 생성하지 않습니다. 즉, 쿼리 응답 시간이 빨라지고, 시스템 자원 사용이 줄어듭니다. 이는 사용자가 대량의 데이터에서 빠르게 정보를 검색할 수 있도록 지원하며, 특히 로그 분석과 같은 작업에서 그 효과를 볼 수 있습니다.

###### **분석기 제한**
`match_only_text` 필드 타입은 `standard` 분석기만 사용할 수 있습니다. 이는 다른 분석기를 사용할 수 없다는 제한이 있지만, 동시에 Elasticsearch의 표준 분석 기능을 사용하여 일관된 성능을 제공합니다. `standard` 분석기는 대부분의 기본적인 텍스트 처리 요구에 충분하며, 일반적인 검색 작업에 적합합니다.

###### **사용 사례**
로깅 시스템에서는 종종 수많은 데이터가 생성되고, 이 데이터 중 많은 부분이 검색되기만 하고 저장만 필요로 합니다. `match_only_text` 필드 타입은 이러한 용도에 적합하여, 검색 가능한 로그 데이터를 보다 경제적으로 저장하고 처리할 수 있습니다. 데이터 분석가나 시스템 관리자는 이 필드 타입을 사용하여 보다 효과적으로 시스템 로그를 분석하고 문제를 신속하게 진단할 수 있습니다.

###### **결론**
`match_only_text` 필드 타입은 Elasticsearch에서 대규모 텍스트 데이터를 효율적으로 처리할 수 있는 강력한 도구입니다. 디스크 공간을 절약하고 검색 성능을 최적화하여, 특히 로그와 같은 대량의 데이터를 다루는 환경에서 그 가치를 발휘합니다. 데이터를 효과적으로 관리하고자 하는 기업이나 개발자에게 이 필드 타입은 매우 유용한 선택이 될 수 있습니다.

### 문자열 데이터 타입 유형 (6) `search_as_you_type`
```plaintext
PUT car-master.static.search_as_you_type
{
	"mappings": {
		"properties": {
			"region": {
				"type": "search_as_you_type"
			}
		}
	}
}
```
Elasticsearch에서 `search_as_you_type` 필드 타입은 특히 실시간으로 사용자의 입력에 반응하는 자동 완성과 같은 기능을 구현할 때 유용합니다. 이 필드 타입은 입력되는 쿼리에 대해 전방 일치(forefix matching)와 중간 일치(substring matching)를 지원하여, 사용자가 타이핑하는 동안 관련 검색 결과를 신속하게 제공합니다.

#### **`search_as_you_type` 필드 타입의 작동 원리**
`search_as_you_type` 필드 타입은 내부적으로 `n-gram` 토크나이저를 사용하여 입력된 텍스트를 색인화합니다. 이 토크나이저는 텍스트를 겹치는 작은 조각들로 나누어 색인하는 방식을 사용하며, 이러한 방식은 사용자가 검색어의 일부만 입력해도 해당 부분을 포함하는 모든 가능한 텍스트를 찾아낼 수 있도록 합니다.

#### **예시: 온라인 책 상점**
예를 들어, 온라인 책 상점에서 책 제목을 기반으로 신속한 검색 제안 기능을 구현하고 싶다고 가정해 보겠습니다. 사용자가 "Harry"라고 입력하기 시작하면, "Harry Potter and the Sorcerer's Stone"부터 시작하는 모든 책 제목을 자동으로 제안하고 싶습니다.

```plaintext
PUT /books
{
  "mappings": {
    "properties": {
      "title": {
        "type": "search_as_you_type"
      }
    }
  }
}
```

이 매핑 설정에서 `title` 필드는 `search_as_you_type` 타입으로 설정되어 있습니다. 사용자가 검색을 시작할 때, Elasticsearch는 입력된 텍스트의 일부를 기반으로 자동으로 제안을 생성합니다.

#### **검색 예시**
사용자가 "Har"를 입력하고 검색을 수행하면, 다음과 같은 검색 쿼리를 사용할 수 있습니다.
```plaintext
POST /books/_search
{
  "query": {
    "multi_match": {
      "query": "Har",
      "type": "bool_prefix",
      "fields": [
        "title",
        "title._2gram",
        "title._3gram"
      ]
    }
  }
}
```
이 쿼리는 `search_as_you_type` 필드 타입의 다양한 내부 필드(`title`, `title._2gram`, `title._3gram`)에 대해 검색을 수행하며, 사용자의 입력에 매칭되는 모든 제목을 찾아냅니다.

#### **결론**
`search_as_you_type` 필드 타입은 사용자의 입력에 신속하게 반응하는 검색 기능을 제공함으로써 사용자 경험을 크게 향상시킵니다. 이 필드 타입은 자동 완성, 빠른 검색 제안 및 인터랙티브한 검색 인터페이스 구현에 이상적으로 사용될 수 있으며, 특히 사용자가 완전한 쿼리를 입력하기 전에 관련 결과를 빠르게 제공하고 싶은 애플리케이션에 적합합니다.

#### **일반 검색과 자동 완성 동시 수행을 하고 싶을 땐?**
Elasticsearch에서 `search_as_you_type` 필드 타입은 `text` 필드 타입의 하위 필드로 직접 구성할 수는 없습니다. `search_as_you_type` 필드 타입은 자체적으로 세 개의 하위 필드(`_2gram`, `_3gram`, `_index_prefix`)를 생성하여 작동합니다. 이러한 내부 구조는 자동 완성과 관련된 검색을 최적화하기 위해 설계되었습니다.

그러나, `text` 필드와 `search_as_you_type` 필드를 동시에 동일한 속성에 적용하여 다양한 검색 요구를 충족시키는 것은 가능합니다. 다음은 동일한 데이터 속성에 대해 `text` 필드와 `search_as_you_type` 필드를 모두 포함시키는 방법의 예시입니다.

##### 예시: 온라인 책 상점 (개선된 매핑 구성)
이 예시에서는 책 제목에 대한 일반 검색과 자동 완성 기능을 모두 지원하고자 합니다. `title` 필드는 일반 검색을 위해 `text` 타입으로 설정하고, 자동 완성을 위해 `title.autocomplete` 하위 필드를 `search_as_you_type` 타입으로 설정합니다.
```plaintext
PUT /books
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "fields": {
          "autocomplete": {
            "type": "search_as_you_type"
          }
        }
      }
    }
  }
}
```
이 구성을 통해, 일반적인 전체 텍스트 검색은 `title` 필드를 사용하여 수행할 수 있고, 실시간 자동 완성 기능은 `title.autocomplete` 필드를 사용하여 수행할 수 있습니다.
##### 검색 예시
사용자가 "Har"를 입력하고 자동 완성 기능을 사용하는 검색을 수행하면, 다음과 같은 쿼리를 사용할 수 있습니다.
```plaintext
POST /books/_search
{
  "query": {
    "multi_match": {
      "query": "Har",
      "type": "bool_prefix",
      "fields": [
        "title.autocomplete",
        "title.autocomplete._2gram",
        "title.autocomplete._3gram"
      ]
    }
  }
}
```
이 쿼리는 `title.autocomplete` 필드와 해당 필드의 내부 하위 필드들을 활용하여 사용자의 입력과 매칭되는 모든 책 제목을 찾아냅니다. 이 방식을 통해 개발자는 하나의 속성에 대해 두 가지 검색 요구사항(일반 검색과 자동 완성)을 모두 충족시킬 수 있습니다.
