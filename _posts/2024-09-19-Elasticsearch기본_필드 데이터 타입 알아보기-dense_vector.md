---
layout: post
title: Elasticsearch - 필드 데이터 타입 알아보기 - (7) `dense_vector`
author: jskim
featuredImage: null
img: null
tags: Elasticsearch, Retrieval
categories: Retrieval
date: '2024-09-19 04:25:00 +0900'
---

#### Reference
- https://github.com/nobaksan/fastcampus-elasticsearch-part1
- https://github.com/munkyu/fastcampus-es
- https://github.com/kkdeok/fastcampus-elasticsearch

#### 오늘의 API
```bash
# dense_vector 예시
PUT car-master.static.dense_vector
{
  "mappings": {
    "properties": {
      "vector_value": {
        "type": "dense_vector",
        "dims": 3,
        "index": true,
        "similarity": "l2_norm",
        "index_options": {
          "type": "hnsw",
          "m": 1,
          "ef_construction": 2
        }
      }
    }
  }
}

PUT car-master.static.dense_vector/_doc/1
{
  "vector_value": [0.5, 1.0, 0.6]
}

PUT car-master.static.dense_vector/_doc/2
{
  "vector_value": [-0.5, 1.4, 0.1]
}

GET car-master.static.dense_vector/_search
{
  "query": {
    "script_score":{
      "query": {
        "match_all": {}
      },
      "script":{
        "source": "l2norm(params.query_vector, 'vector_value')",
        "params": {
          "query_vector": [0.4, 0.9, 0.5]
        }
      }
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

## `dense_vector` 타입
### Elasticsearch의 `dense_vector` 필드 타입 소개
Elasticsearch는 다양한 데이터 유형을 지원하며, 그 중 `dense_vector` 필드 타입은 특히 기계 학습과 유사 벡터 검색에 사용됩니다. 이 필드 타입은 이미지 검색, 추천 시스템, 유사 문서 검색 등 다양한 분야에서 벡터 기반의 유사도 측정을 가능하게 합니다.
#### `dense_vector`의 주요 사용 사례
`dense_vector` 필드는 주로 유사한 아이템을 찾기 위한 벡터 데이터를 저장하는 데 사용됩니다. 이는 부동 소수점 배열로 구성되며, 스크립트 점수 쿼리(script score query)나 KNN(k-Nearest Neighbors) 검색 API를 통해 유사 벡터를 검색할 때 활용됩니다.
##### KNN 검색과 HNSW 알고리즘

Elasticsearch는 KNN 검색을 지원하며, 이를 위해 HNSW(Hierarchical Navigable Small World) 알고리즘을 사용합니다. HNSW 알고리즘은 그래프 기반 검색을 통해 높은 정확도와 검색 속도를 제공합니다. 벡터의 색인 시간은 설정에 따라 다르지만, 일반적으로 색인 시간은 오래 걸리며, 검색의 정확도는 높아집니다.
#### `dense_vector` 필드의 주요 매개변수
`dense_vector` 필드 타입을 설정할 때 다양한 매개변수를 구성할 수 있습니다. 주요 매개변수는 다음과 같습니다:
- **type**: 현재 Elasticsearch는 KNN 알고리즘으로 HNSW만을 지원합니다.
- **m**: HNSW 그래프에서 각 노드가 연결된 근접 이웃의 수를 나타내며, 기본값은 16입니다. 이 값이 클수록 색인 속도는 느려지지만 검색의 정확도는 향상됩니다.
- **ef_construction**: 색인 시 최근접 이웃 목록을 구성할 때 추적할 후보 수를 의미하며, 기본값은 100입니다. 이 값이 클수록 검색 속도는 느려지지만, 정확도는 높아집니다.
- **dims**: 벡터의 차원 수를 의미하며, 최대 2048 차원까지 설정할 수 있습니다.
- **index**: 필드가 검색 가능한지 여부를 지정합니다.
- **similarity**: KNN 검색에서 사용할 벡터 유사도 메트릭을 지정합니다. `l2_norm`, `dot_product`, `cosine` 등이 사용 가능합니다.
#### 결론
`dense_vector` 필드 타입은 Elasticsearch에서 벡터 데이터를 효과적으로 관리하고, 복잡한 유사도 기반 검색을 실행할 수 있는 강력한 도구입니다. 이미지 검색, 문서 유사도 검색, 추천 시스템 등 다양한 애플리케이션에서 이 필드 타입의 활용을 고려해 볼 수 있습니다.

### `dense_vector` 타입 예시
```bash
PUT car-master.static.dense_vector
{
  "mappings": {
    "properties": {
      "vector_value": {
        "type": "dense_vector",
        "dims": 3,
        "index": true,
        "similarity": "l2_norm",
        "index_options": {
          "type": "hnsw",
          "m": 1,
          "ef_construction": 2
        }
      }
    }
  }
}

PUT car-master.static.dense_vector/_doc/1
{
  "vector_value": [0.5, 1.0, 0.6]
}

PUT car-master.static.dense_vector/_doc/2
{
  "vector_value": [-0.5, 1.4, 0.1]
}
```
위와 같이 index를 생성하고, 2개의 문서를 인덱싱했습니다.
그리고 아래와 같이 search를 수행합니다.
```bash
GET car-master.static.dense_vector/_search
{
  "query": {
    "script_score":{
      "query": {
        "match_all": {}
      },
      "script":{
        "source": "l2norm(params.query_vector, 'vector_value')",
        "params": {
          "query_vector": [0.4, 0.9, 0.5]
        }
      }
    }
  }
}
```
그럼 결과는 아래와 같이 도출됩니다.
```bash
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
      "value": 2,
      "relation": "eq"
    },
    "max_score": 1.104536,
    "hits": [
      {
        "_index": "car-master.static.dense_vector",
        "_id": "2",
        "_score": 1.104536,
        "_source": {
          "vector_value": [
            -0.5,
            1.4,
            0.1
          ]
        }
      },
      {
        "_index": "car-master.static.dense_vector",
        "_id": "1",
        "_score": 0.1732051,
        "_source": {
          "vector_value": [
            0.5,
            1,
            0.6
          ]
        }
      }
    ]
  }
}
```
위 결과에서 `"_score"`가 중요합니다. 이 값이 `l2_norm` 값입니다. `l2_norm`이 가장 적은 값(가장 가까운)이 최근접 이웃으로 검색 결과 값으로 선택됩니다. 따라서 위 결과에서 `"_score": 0.1732051,`를 갖는 `"_id": "1"` 의 데이터포인트가 검색 결과로 최근접 데이터로 확인 가능합니다.