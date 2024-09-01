---
layout: post
title: Elasticsearch - 데이터 모델링 이해하기 (1) 인덱스 생성, 삭제, CLOSE, OPEN
author: jskim
featuredImage: null
img: null
tags: Elasticsearch, Retrieval
categories: Retrieval
date: '2024-09-01 00:25:00 +0900'
---

#### Reference
- https://github.com/nobaksan/fastcampus-elasticsearch-part1
- https://github.com/munkyu/fastcampus-es
- https://github.com/kkdeok/fastcampus-elasticsearch

#### 오늘의 API
```plaintext
# index 생성 - settings
PUT /car-master
{
	"settings":{
		"index": {
			"number_of_shards": 2,
			"number_of_replicas": 1
		}
	}
}

# index 생성 - mappings
PUT car-master.v2
{
	"settings":{
		"number_of_shards":2,
		"number_of_replicas":1
	},
	"mappings":{
		"properties":{
			"id":{
				"type": "keyword"
			},
			"brand":{
				"type": "keyword"
			},
      ...
    }
  }
}

# index 조회
GET car-master
GET car-master/_mapping
GET car-master/_setting

# 인덱스 삭제
DELETE car-master
DELETE car-master.*

# 인덱스 OPEN
POST car-master/_open

# 인덱스 CLOSE
POST car-master/_close
```

### 인덱스 생성
- 인덱스 : RDB(SQL)의 테이블과 같은 개념
	- 데이터를 담을 수 있는 그릇 생성

```plaintext
PUT /car-master
{
	"settings":{
		"index": {
			"number_of_shards": 2,
			"number_of_replicas": 1
		}
	}
}
```
- 이미 인덱스가 존재하는 경우, 400 에러 발생
#### 인덱스 생성 과정 및 고려사항
- 인덱스 생성 과정
	- 인덱스 생성 API 호출 시, master 노드에 생성
	- master 노드는 데이터 노드에 인덱스 생성 요청
	- 데이터 노드는 샤드 생성 및 데이터가 색인될 준비
- 인덱스 생성 시 고려 사항
	- 인덱스의 샤드 설계 리소스가 낭비되지 않도록 주의
	- 인덱스 생성시 한 개의 샤드는 20 ~ 25GB의 데이터 추가가 적당
	- 샤드의 갯수가 많을 수록 색인 시간은 늘어나지만 검색 시간은 줄어듦
- 주의 사항
	- 인덱스 생성 후, 일부 설정은 변경 불가
		- 예 : `number_of_shards`, `number_of_replicas`는 한번 설정하면 변경 불가

##### 인덱스 생성 시 setting 정보

| 세팅 정보                   | 설정                                               |
| ----------------------- | ------------------------------------------------ |
| number_of_shards        | 인덱스를 구성하는 Primary Shard 지정<br>데이터 분산 및 병렬 처리에 영향 |
| number_of_replicas      | replica shards의 수를 지정<br>데이터 가용성 및 읽기 처리 증가      |
| index.refresh_interval  | 인덱스 새로고침 간격 설정<br>색인된 문서의 검색 가능 시간 설정            |
| index.store.type        | 인덱스 저장 타입 지정                                     |
| index.codec             | 데이터 압축에 사용되는 코덱 설정                               |
| index.max_result_window | 검색 결과로 반환할 문서의 최대 수 설정   
                        |
##### 인덱스 생성 - Settings
```plaintext
PUT /car-master.settings
{
	"settings":{
		"index": {
			"number_of_shards": 3,
			"number_of_replicas": 2,
			"refresh_interval": "30s",
			"store": {"type": "fs"},
			"codec": "best_compression",
			"routing": {"allocation" : {"include" : {"_tier_preference" : "data_content"}}}
		}
	}
}
```

##### 인덱스 생성 - Mappings
- Mappings
	- 데이터 구조, 저장 및 검색 방식 정의
	- 체계적인 데이터 관리 및 효율적 검색 지원
	- 한번 생성된 mapping은 삭제할 수 없음
		- 이미 생성된 mapping을 삭제/변경 하고자 할 경우
			1. 새로운 인덱스 생성 > 변경된 정보로 매핑 추가
			2. 모든 문서를 재색인
				- 신규 데이터로 데이터 추가
				- 기존 인덱스에서 신규 인덱스로 문서 이관
			3. 신규 인덱스 데이터 확인
			4. 기존 인덱스 삭제

```plaintext
PUT car-master.v2
{
	"settings":{
		"number_of_shards":2,
		"number_of_replicas":1
	},
	"mappings":{
		"properties":{
			"id":{
				"type": "keyword"
			},
			"brand":{
				"type": "keyword"
			},
			"model":{
				"type": "keyword"
			},
			"price":{
				"type": "long"
			},
			"fuel":{
				"type": "keyword"
			},
			"imgae_url":{
				"type": "keyword"
			},
			"color": {
				"type": "keyword"
			}
		}
	}
}
```
위 `mapping`정보에서 `type`으로 `keyword`가 지정됐는 데, `keyword`로 지정하는 경우는 아래와 같다.

>Elasticsearch에서 `keyword` 유형은 특정 필드를 전체적으로 하나의 데이터로 취급하며, 텍스트를 정확하게 일치시켜 검색할 때 주로 사용됩니다. 이 유형의 데이터는 분석되지 않기 때문에, 입력된 데이터가 그대로 인덱스에 저장됩니다. 그 결과, 이 필드들은 완벽히 일치하는 정확한 값으로 검색할 수 있습니다.
>
>`keyword` 타입의 주요 특징과 역할은 다음과 같습니다:
>1. **정확한 일치 검색**: `keyword` 타입은 텍스트 분석 과정을 거치지 않기 때문에, 검색 시 입력한 텍스트와 정확히 일치하는 결과만을 반환합니다. 예를 들어, "BMW"라는 브랜드명을 정확히 입력해야 해당 결과를 얻을 수 있습니다.
>2. **집계와 정렬**: `keyword` 타입은 데이터 집계나 정렬에 적합합니다. 분석되지 않은 전체 값으로 데이터를 처리하기 때문에, 예를 들어 특정 브랜드의 자동차 수를 세거나, 브랜드명으로 정렬하는 등의 작업에 유용합니다.
>3. **필터링**: `keyword` 타입은 필터링 조건에 자주 사용됩니다. 특정 필드가 주어진 키워드를 정확하게 포함하는 문서를 찾는 데 사용할 수 있습니다.
>4. **효율적인 저장과 검색 성능**: 문자열을 분석하지 않고 저장하므로, 저장 공간을 효율적으로 사용하고, 검색 속도 또한 빠릅니다.
>
>예를 들어, 자동차 정보에서 "brand", "model", "fuel", "color" 같은 필드는 일반적으로 몇 가지 정해진 값만 가지며, 이러한 필드들을 `keyword` 타입으로 설정하면, 사용자는 해당 값들에 대해 정확한 검색과 빠른 데이터 처리를 할 수 있습니다.("ChatGPT")
##### 인덱스 생성 - Mappings 정보 추가
위에서 `car-master`, `car-master.settings`, `car-master.v2`라는 3개의 index를 생성(`PUT`)했습니다.
이 중에서 `car-master` index의 mapping정보를 추가해보겠습니다.

**mapping 정보 추가 전 index 상태**
```plaintext
GET /car-master
```

```plaintext
{
  "car-master": {
    "aliases": {},
    "mappings": {},
    "settings": {
      "index": {
        "routing": {
          "allocation": {
            "include": {
              "_tier_preference": "data_content"
            }
          }
        },
        "number_of_shards": "2",
        "provided_name": "car-master",
        "creation_date": "1725152783205",
        "number_of_replicas": "1",
        "uuid": "O-rIQXO-QuWawqQpAT6pLw",
        "version": {
          "created": "8512000"
        }
      }
    }
  }
}
```

**mapping 정보 추가**
```plaintext
PUT car-master/_mapping
{
  "properties":{
    "id":{
      "type":"keyword"
    },
    "brand":{
      "type":"keyword"
    },
    "model":{
      "type":"keyword"
    },
    "price":{
      "type":"keyword"
    },
    "fuel":{
      "type":"keyword"
    },
    "image_url":{
      "type":"keyword"
    },
    "color":{
      "type":"keyword"
    }
  }
}

```

```plaintext
{
  "acknowledged": true
}
```

**mapping 정보 추가 결과**
```plaintext
GET /car-master
```

```plaintext
{
  "car-master": {
    "aliases": {},
    "mappings": {
      "properties": {
        "brand": {
          "type": "keyword"
        },
        "color": {
          "type": "keyword"
        },
        "fuel": {
          "type": "keyword"
        },
        "id": {
          "type": "keyword"
        },
        "image_url": {
          "type": "keyword"
        },
        "model": {
          "type": "keyword"
        },
        "price": {
          "type": "keyword"
        }
      }
    },
    "settings": {
      "index": {
        "routing": {
          "allocation": {
            "include": {
              "_tier_preference": "data_content"
            }
          }
        },
        "number_of_shards": "2",
        "provided_name": "car-master",
        "creation_date": "1725152783205",
        "number_of_replicas": "1",
        "uuid": "O-rIQXO-QuWawqQpAT6pLw",
        "version": {
          "created": "8512000"
        }
      }
    }
  }
}
```

```plaintext
GET car-master/_mapping
```

```plaintext
{
  "car-master": {
    "mappings": {
      "properties": {
        "brand": {
          "type": "keyword"
        },
        "color": {
          "type": "keyword"
        },
        "fuel": {
          "type": "keyword"
        },
        "id": {
          "type": "keyword"
        },
        "image_url": {
          "type": "keyword"
        },
        "model": {
          "type": "keyword"
        },
        "price": {
          "type": "keyword"
        }
      }
    }
  }
}
```

### 인덱스 삭제
인덱스를 삭제한다는 것은 샤드, 설정, 매핑, 데이터를 삭제한다는 것을 의미

```plaintext
DELETE car-master
DELETE car-master.settings
DELETE car-master.v2

또는

DELETE car-master.*
```

### 인덱스 CLOSE
- 인덱스를 읽기 전용으로 만들어 자원 절약
	- 인덱스 `DELETE`의 대안으로 사용하기도 함
- 나중에 다시 열 수 있음
- **`CLOSE`상태에서 조회(`GET`)를 수행하면 400 ERROR 발생**

```plaintext
POST car-magrer.v2/_close
```

### 인덱스 OPEN
- 인덱스를 다시 사용할 수 있는 상태로 만들기 위해 사용
```plaintext
POST car-master.v2/_open
```