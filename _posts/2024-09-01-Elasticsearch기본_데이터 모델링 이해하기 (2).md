---
layout: post
title: Elasticsearch - 데이터 모델링 이해하기 (2) 인덱스 재색인, Refresh
author: jskim
featuredImage: null
img: null
tags: Elasticsearch, Retrieval
categories: Retrieval
date: '2024-09-01 00:25:00 +0900'
---

#### Reference
- jsons://github.com/nobaksan/fastcampus-elasticsearch-part1
- jsons://github.com/munkyu/fastcampus-es
- jsons://github.com/kkdeok/fastcampus-elasticsearch

#### 오늘의 API
```json
# index 데이터 삽입
PUT car-master/_doc/1
{
  "id":1,
  "brand":"hyundai"
}

# index 재생성
POST _reindex
{
  "source":{
    "index":"car-master",
    "query":{
      "term":{
        "brand":{
          "value":"hyundai"
        }
      }
    }
  },
  "dest":{
    "index":"car-master.v2"
  }
}

# index 내 데이터 조회
GET car-master.v2/_search
{
  "query":{
    "term":{
      "brand":"hyundai"
    }
  }
}

GET car-master/_search
{
  "query": {
    "match_all": {}
  }
}

GET car-master.v2/_search

# index Refresh
POST car-master.v2/_refresh
```

### 인덱스 재색인(`_reindex`)
- 새로운 인덱스에 데이터를 다시 색인
	- 분석기를 변경하는 경우
	- 필드 추가 등의 구조 변경
	- 사용하지 않는 필드 제거

#### 인덱스 재색인(`_reindex`) 파라미터
| depth 1 | depth 2  | 설명                                        |
| ------- | -------- | ----------------------------------------- |
| Source  | index    | 복제할 인덱스 혹은 인덱스 목록                         |
|         | query    | 인덱스 중 일부만 복사하고 싶은 경우, elasticsearch 쿼리 사용 |
|         | sort     | 문서의 정렬하는 방법을 정의                           |
| dest    | _source  | 특정 필드만 선택하여 색인 진행                         |
|         | index    | 복제될 인덱스                                   |
|         | pipeline | 수집을 위한 사용자 지정 파이프라인 정의                    |
|         | size     | 색인 될 문서 수                                 |

##### `car-master` 인덱스 생성
아래와 같이 `car-master` index 생성합니다.
```json
PUT car-master
{
	"settings":{
		"index": {
			"number_of_shards": 2,
			"number_of_replicas": 1
		}
	},
 "mappings": {
   "properties": {
     "id":{
       "type":"keyword"
     },
     "brand":{
       "type":"keyword"
     }
   }
 }
}
```

##### `car-master` 인덱스 데이터 생성
그리고 `car-master` index에 새로운 데이터(doc)을 생성해줍니다.
```json
PUT car-master/_doc/1
{
  "id":1,
  "brand":"hyundai"
}
```

##### `car-master` 인덱스 재생성(`_reindex`)
이제 `_reindex`를 수행합니다.
`car-master`를 `car-master.v2`라는 곳으로 reindex 합니다.
```json
POST _reindex
{
  "source":{
    "index":"car-master",
    "query":{
      "term":{
        "brand":{
          "value":"hyundai"
        }
      }
    }
  },
  "dest":{
    "index":"car-master.v2"
  }
}
```
`POST` 결과는 아래와 같습니다.
결과갸 이상합니다. 'created' 필드의 값이 0입니다.
이는 reindex 과정에서 car-master.v2에 제대로 데이터가 재색인되지 않았음을 의미합니다.
```json
{
  "took": 2,
  "timed_out": false,
  "total": 0,
  "updated": 0,
  "created": 0,
  "deleted": 0,
  "batches": 0,
  "version_conflicts": 0,
  "noops": 0,
  "retries": {
    "bulk": 0,
    "search": 0
  },
  "throttled_millis": 0,
  "requests_per_second": -1,
  "throttled_until_millis": 0,
  "failures": []
}
```

##### `car-master` 인덱스 재생성(`_reindex`) 트러블 슈팅 

###### 데이터 존재 여부 확인(`GET index/_search`)
원인으로 먼저 `car-master` 인덱스 자체에 "brand"가 "hyundai"인 값을 갖는 데이터가 없었고, `_reindex`의 query 조건에 해당하는 데이터가 없어 실패한 것 일수도 있습니다.
따라서 `car-master` 인덱스에 "brand"가 "hyundai"인 데이터가 있는 지 찾아보겠습니다.
```json
GET car-master/_search
{
  "query": {
    "term": {
      "brand": "hyundai"
    }
  }
}
```
그 결과, 아래와 같이 `"hits"`에 `"value"`필드의 값이 0인 것을 볼 수 있습니다.
즉 해당하는 값이 없었다는 의미입니다.
```json
{
  "took": 0,
  "timed_out": false,
  "_shards": {
    "total": 2,
    "successful": 2,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 0,
      "relation": "eq"
    },
    "max_score": null,
    "hits": []
  }
}
```
아래와 같이 `match_all`을 통해 인덱스에 어떤 데이터가 있는지 전체적으로 살펴봐도
```json
GET car-master/_search
{
  "query": {
    "match_all": {}
  }
}
```
현재 `car-master` 인덱스 안애 데이터가 없는(`hits`의 total value가 0) 것을 볼 수 있습니다.
```json
{
  "took": 0,
  "timed_out": false,
  "_shards": {
    "total": 2,
    "successful": 2,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 0,
      "relation": "eq"
    },
    "max_score": null,
    "hits": []
  }
}
```

###### 데이터 삽입(`PUT car-master/_doc/1`)
다시 데이터(doc)를 `car-master`인덱스에 넣어줍니다.
```json
PUT car-master/_doc/1
{
  "id":1,
  "brand":"hyundai"
}

# 결과
 {
  "_index": "car-master",
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
그리고 다시 `car-master` 내 데이터를 조회해봅니다.
```json
GET car-master/_search
{
  "query": {
    "match_all": {}
  }
}

# 결과
{
  "took": 1,
  "timed_out": false,
  "_shards": {
    "total": 2,
    "successful": 2,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 1,
      "relation": "eq"
    },
    "max_score": 1,
    "hits": [
      {
        "_index": "car-master",
        "_id": "1",
        "_score": 1,
        "_source": {
          "id": 1,
          "brand": "hyundai"
        }
      }
    ]
  }
}
```
이번엔 `hits`필드를 볼 때, 제대로 데이터가 삽입된 걸 볼 수 있습니다.

###### 인덱스 재생성(`POST _reindex`)
그럼 다시 `_reindex`를 수행합니다.
```json
POST _reindex
{
  "source":{
    "index":"car-master",
    "query":{
      "term":{
        "brand":{
          "value":"hyundai"
        }
      }
    }
  },
  "dest":{
    "index":"car-master.v2"
  }
}

# 결과
{
  "took": 134,
  "timed_out": false,
  "total": 1,
  "updated": 0,
  "created": 1,
  "deleted": 0,
  "batches": 1,
  "version_conflicts": 0,
  "noops": 0,
  "retries": {
    "bulk": 0,
    "search": 0
  },
  "throttled_millis": 0,
  "requests_per_second": -1,
  "throttled_until_millis": 0,
  "failures": []
}
```
이번에는 `created`의 필드 값이 1로, 제대로 reindex된 것을 볼 수 있습니다.
그럼 query로 직접 다시 확인해보겠습니다.
```json
GET car-master.v2/_search
{
  "query":{
    "term":{
      "brand":"hyundai"
    }
  }
}

# 결과
{
  "took": 1,
  "timed_out": false,
  "_shards": {
    "total": 1,
    "successful": 1,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 1,
      "relation": "eq"
    },
    "max_score": 0.2876821,
    "hits": [
      {
        "_index": "car-master.v2",
        "_id": "1",
        "_score": 0.2876821,
        "_source": {
          "id": 1,
          "brand": "hyundai"
        }
      }
    ]
  }
}
```
이번에는 `car-master.v2`에서 `"brand":"hyundai"`인 데이터가 1건 존재함을 볼 수 있습니다.(`hits` 필드)

### 인덱스 Refresh
- 인덱스 최신화
	- 인덱스에 새로운 데이터를 추가하여도, refresh를 하지 않으면 바로 새 데이터가 검색 가능하도록 반영되지 않음
	- 따라서 바로 검색 가능하도록 하려면, 인덱스 변경 후 refresh를 해줘야 함

이를 실제로 확인해 보겠습니다.
확인하는 방법은 아래와 같습니다.
1. `car-master.v3` 인덱스 생성(refresh_interval을 -1로 주어, refresh를 수행하지 않도록 생성)
2. `car-master.v3`인덱스에 데이터 추가
3. `car_master.v3`인덱스에서 데이터 조회
	- 데이터가 조회되지 않아야 정상(데이터 추가 후 refresh를 수행하지 않았기 때문)
4. `car-master.v3`인덱스에 대한 refresh API 실행
	- 데이터가 조회되어야 정상(refresh를 수행했기 때문)

1. `car-master.v3` 인덱스 생성(refresh_interval을 -1로 주어, refresh를 수행하지 않도록 생성)
2. `car-master.v3`인덱스에 데이터 추가
```json
PUT car-master.v3
{
  "settings": {
    "index":{
      "refresh_interval":"-1"
    }
  }
}
```
```json
PUT car-master.v3/_doc/1
{
  "brand":"hyundai"
}
```
3. `car_master.v3`인덱스에서 데이터 조회
	- 데이터가 조회되지 않아야 정상(데이터 추가 후 refresh를 수행하지 않았기 때문)
```json
GET car-master.v3/_search

# 결과
{
  "took": 0,
  "timed_out": false,
  "_shards": {
    "total": 1,
    "successful": 1,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 0,
      "relation": "eq"
    },
    "max_score": null,
    "hits": []
  }
}
```
위 조회 결과, `hits`필드에 조회된 데이터가 없는 것을 알 수 있습니다.
즉 데이터를 추가해주었지만, refresh를 하지 않았기 때문에 반영되지 않았고, 결과적으로 검색되지 않는 것입니다.
이번엔 refresh를 수행하고, 그 결과를 살펴보겠습니다.

4. `car-master.v3`인덱스에 대한 refresh API 실행
	- 데이터가 조회되어야 정상(refresh를 수행했기 때문)
```json
POST car-master.v3/_refresh

# 결과
{
  "_shards": {
    "total": 2,
    "successful": 1,
    "failed": 0
  }
}
```
refresh 이후, 다시 조회해보겠습니다.
```json
GET car-master.v3/_search

# 결과
{
  "took": 0,
  "timed_out": false,
  "_shards": {
    "total": 1,
    "successful": 1,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 1,
      "relation": "eq"
    },
    "max_score": 1,
    "hits": [
      {
        "_index": "car-master.v3",
        "_id": "1",
        "_score": 1,
        "_source": {
          "brand": "hyundai"
        }
      }
    ]
  }
}
```
이번에는 제대로 refresh되어 데이터가 조회되는 것을 확인할 수 있습니다.