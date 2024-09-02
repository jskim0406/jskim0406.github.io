---
layout: post
title: Elasticsearch - 단일 데이터(문서) 저장 기본
author: jskim
featuredImage: null
img: null
tags: Elasticsearch, Retrieval
categories: Retrieval
date: '2024-09-02 00:25:00 +0900'
---

#### Reference
- https://github.com/nobaksan/fastcampus-elasticsearch-part1
- https://github.com/munkyu/fastcampus-es
- https://github.com/kkdeok/fastcampus-elasticsearch

#### 오늘의 API
```plaintext
# index refresh interval 세팅
PUT car-master.v3/_settings
{
  "index.refresh_interval": "1s"
}

# 단일 문서 저장(w/ "id")
PUT car-master.v3/_doc/1
{
  "brand":"현대",
  "color":"흰색",
  "id":"1",
  "model":"아반떼",
  "price":"2000"
}

# 단일 문서 저장(/wo "id") > id가 없으면 UUID(고유식별자)를 elastic이 자동으로 생성
POST car-master.v3/_doc
{
  "brand":"현대",
  "color":"검은색",
  "model":"그랜져",
  "price":"7000"
}

# 단일 문서 조회
GET car-master.v3/_doc/1

# 단일 문서 조회(특정 필드 만)
GET car-master.v3/_doc/1?_source={필드명}
GET car-master.v3/_doc/1?_source=brand

# 복수 문서 조회(필드 조건)
예) 조건 : "brand"=="현대"
## 1. term 쿼리 사용(정확한 값으로 일치하는 문서를 찾을 때 사용)
GET car-master.v3/_search
{
  "query": {
    "term": {
      "brand": "현대"
    }
  }
}

## 2. match 쿼리 사용
GET car-master.v3/_search
{
  "query": {
    "match": {
      "brand": "현대"
    }
  }
}

# 문서 업데이트
POST car-master.v3/_update/1
{
  "doc":{
    "brand":"닷지"
  }
}

# 문서 업데이트(스크립트 사용)
POST car-master.v3/_update/1
{
  "script": {
    "source": "if (ctx._source.brand==params.brand) {ctx._source.brand=params.replace_brand}",
    "params": {
      "brand": "닷지",
      "replace_brand": "BMW"
    }
  }
}

# 문서 삭제
DELETE car-master.v3/_doc/1

# 복수 문서 업데이트(스크립트 사용)
POST car-master.v3/_update_by_query
{
  "script": {
    "source": "ctx._source.brand=params.brand",
    "params": {
      "brand": "Mercedes"
    }
  },
  "query": {
    "term": {
      "brand.keyword": {
        "value": "BMW"
      }
    }
  }
}

# 복수 문서 삭제
POST car-master.v3/_delete_by_query
{
  "query": {
    "term": {
      "brand.keyword": {
        "value": "Mercedes"
      }
    }
  }
}
```

### 단일 문서 저장(w/ doc id)
```plaintext
PUT car-master.v3/_doc/1
{
  "brand":"현대",
  "color":"흰색",
  "id":"1",
  "model":"아반떼",
  "price":"2000"
}

# 결과
{
  "_index": "car-master.v3",
  "_id": "1",
  "_version": 3,
  "result": "updated",
  "_shards": {
    "total": 2,
    "successful": 1,
    "failed": 0
  },
  "_seq_no": 2,
  "_primary_term": 1
}


# 결과 해석
_index: 색인된 문서가 속한 Elasticsearch 인덱스명. 데이터 분류 및 구별에 사용
_id: 문서의 고유 식별자, 문서 찾기 및 관리에 필요
_version: 문서의 버전 번호, 업데이트마다 증가하여 변경 이력 추적
_result: 문서 상태 (생성, 업데이트, 삭제 등), 작업 결과 표시
_shards:, 색인 작업이 수행된 샤드의 성공/실패 여부_
_seq_no 및 _primary_term:, Elasticsearch 내부 메타데이터, 문서 일관성 유지에 사용
```

### 단일 문서 저장(wo/ doc id)
```plaintext
POST car-master.v3/_doc
{
  "brand":"현대",
  "color":"검은색",
  "model":"그랜져",
  "price":"7000"
}

# 결과
{
  "_index": "car-master.v3",
  "_id": "GMGTspEB2w0M87I0xL2R",   # UUID 생성
  "_version": 1,
  "result": "created",
  "_shards": {
    "total": 2,
    "successful": 1,
    "failed": 0
  },
  "_seq_no": 3,
  "_primary_term": 1
}
```

실제로 데이터를 조회하면 아래와 같이 `UUID`로 데이터가 표기되는 것을 확인할 수 있습니다.

```plaintext
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
      "value": 2,
      "relation": "eq"
    },
    "max_score": 1,
    "hits": [
      {
        "_index": "car-master.v3",
        "_id": "1",
        "_score": 1,
        "_source": {
          "brand": "현대",
          "color": "흰색",
          "id": "1",
          "model": "아반떼",
          "price": "2000"
        }
      },
      {
        "_index": "car-master.v3",
        "_id": "GMGTspEB2w0M87I0xL2R",
        "_score": 1,
        "_source": {
          "brand": "현대",
          "color": "검은색",
          "model": "그랜져",
          "price": "7000"
        }
      }
    ]
  }
}
```