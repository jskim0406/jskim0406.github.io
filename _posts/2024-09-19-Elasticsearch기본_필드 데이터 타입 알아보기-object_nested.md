---
layout: post
title: Elasticsearch - 필드 데이터 타입 알아보기 - (6) `object`, `nested`
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
# object 데이터 타입
PUT car-master.static.object/_doc/1
{
  "id": "0123456789",
  "region": "hudson valley",
  "price": "18997",
  "year": "2013",
  "brand": {
    "korean_name": "닷지",
    "english_name": "durango"
  }
}

# nested 데이터 타입
PUT /products
{
  "mappings": {
    "properties": {
      "product_id": {
        "type": "text"
      },
      "reviews": {
        "type": "nested",  // Nested 필드 타입 지정
        "properties": {
          "user_id": {
            "type": "text"
          },
          "comment": {
            "type": "text"
          },
          "rating": {
            "type": "integer"
          }
        }
      }
    }
  }
}

POST /products/_doc/1
{
  "product_id": "12345",
  "reviews": [
    {
      "user_id": "user1",
      "comment": "Great product!",
      "rating": 5
    },
    {
      "user_id": "user2",
      "comment": "Not what I expected.",
      "rating": 2
    }
  ]
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

## `object` 타입
### Elasticsearch의 `object` 필드 타입 이해
Elasticsearch에서 데이터는 종종 복잡한 구조를 가지며, 이러한 데이터는 JSON 포맷을 통해 표현됩니다. JSON은 자연스럽게 중첩된 객체와 배열을 사용하여 데이터를 계층적으로 구성할 수 있습니다. 예를 들어, 사용자 데이터가 주소, 연락처 정보 등 여러 필드를 포함할 수 있으며, 이 필드들은 추가적인 세부 사항을 가진 내부 객체로 표현될 수 있습니다.
#### Object 데이터 타입의 특징
Elasticsearch의 Object 필드 타입은 이러한 중첩 구조를 효과적으로 처리합니다. Object 타입 필드는 JSON 객체를 받아 이를 내부적으로 키-값 쌍의 평탄화된(flat) 형태로 변환하여 저장합니다. 이는 Elasticsearch가 계층적 데이터 구조를 색인화하고 검색할 수 있게 해줍니다.
##### 예시: 사용자 데이터의 저장
JSON으로 표현된 사용자 데이터가 다음과 같을 때,
```bash
{
  "name": "Jane Doe",
  "contact": {
    "email": "jane@example.com",
    "phone": "123-456-7890"
  }
}
```
Elasticsearch는 이를 내부적으로 다음과 같이 평탄화하여 저장합니다:
- `name`: Jane Doe
- `contact.email`: jane@example.com
- `contact.phone`: 123-456-7890
이러한 변환은 중첩된 구조에 대한 직접적인 경로를 제공하며, 각 중첩 레벨의 데이터를 독립적으로 색인화하고 검색할 수 있게 합니다. 예를 들어, `contact.email` 필드를 특정 쿼리의 대상으로 지정하여 이메일 주소로 사용자를 검색할 수 있습니다.
#### 계층적 데이터 관리의 이점
Object 타입의 사용은 Elasticsearch에서 복잡한 데이터 구조를 간편하게 관리하고, 효율적인 데이터 검색을 가능하게 하는 중요한 기능입니다. 개발자는 이를 통해 다양한 데이터 소스에서 얻은 정보를 통합하고, 강력한 검색 엔진을 구축할 수 있습니다.

이러한 특성은 데이터가 계층적이며, 상호 연관성이 있는 현대의 애플리케이션에 매우 적합합니다. Elasticsearch의 Object 데이터 타입을 사용함으로써, 보다 정교하고 유연한 데이터 구조를 설계하고 최적화할 수 있습니다.

## `nested` 타입
### Elasticsearch의 Nested 필드 타입 이해하기
Elasticsearch는 복잡한 데이터 구조를 다루는 데 특화된 기능을 제공하는데, 이 중에서도 Nested 필드 타입은 특히 배열 내부의 객체들을 효과적으로 관리할 수 있게 해줍니다. Nested 필드 타입은 Object 필드 타입을 더 발전시킨 형태로, 배열 안에 들어있는 객체들을 각각 독립된 문서로 취급하여 저장하고 조회할 수 있게 합니다.
#### Nested 필드의 특성과 사용법
Nested 필드 타입은 Object 배열을 저장할 때 사용됩니다. 이 타입은 저장된 각 객체를 독립된 하위 문서로 처리하므로, 배열 내부의 객체들 간의 경계를 명확하게 구분합니다. 이 구조는 중첩된 쿼리(Nested Query)를 사용하여 특정 조건에 맞는 객체만을 선택적으로 검색할 수 있게 해줍니다.
##### 예시: 제품과 리뷰 데이터의 저장
예를 들어, 하나의 제품에 여러 개의 사용자 리뷰가 있는 경우를 생각해 보겠습니다. 각 리뷰는 사용자 ID, 리뷰 내용, 평점 등 여러 정보를 포함할 수 있습니다.
```bash
{
  "product_id": "12345",
  "reviews": [
    {
      "user_id": "user1",
      "comment": "Great product!",
      "rating": 5
    },
    {
      "user_id": "user2",
      "comment": "Not what I expected.",
      "rating": 2
    }
  ]
}
```
이 데이터 구조를 Elasticsearch에 저장할 때 Nested 필드 타입을 사용하면, `reviews` 필드 내 각 리뷰가 독립된 하위 문서로 취급됩니다. 이는 각 리뷰의 정보가 서로 다른 리뷰의 정보와 혼합되지 않도록 보장합니다.
#### Nested 쿼리의 활용
Nested 필드 타입의 큰 장점은 특정 조건을 만족하는 내부 객체만을 검색할 수 있다는 것입니다. 예를 들어, 평점이 5점인 리뷰만을 찾고자 할 때, Nested 쿼리를 사용하면 해당 조건에 맞는 리뷰 객체만을 필터링하여 검색 결과로 반환할 수 있습니다.
```bash
{
  "query": {
    "nested": {
      "path": "reviews",
      "query": {
        "match": {
          "reviews.rating": 5
        }
      }
    }
  }
}
```
이 쿼리는 `reviews` 필드가 Nested 필드 타입으로 정의되어 있을 때만 정상적으로 작동합니다. 중첩된 구조를 효과적으로 다루면서도 데이터의 독립성을 유지할 수 있어, 복잡한 데이터 관계를 더욱 섬세하게 쿼리할 수 있는 강력한 도구가 됩니다.
#### + Elasticsearch에 Nested 필드 타입으로 데이터 인덱싱하기
첫 번째 단계로, 인덱스를 생성하고 Nested 필드 타입을 포함하는 매핑을 설정해야 합니다. 이 예제에서는 `products`라는 인덱스를 생성하고, `reviews` 필드를 Nested 타입으로 지정합니다.
##### 인덱스 생성 및 매핑 설정
```bash
PUT /products
{
  "mappings": {
    "properties": {
      "product_id": {
        "type": "text"
      },
      "reviews": {
        "type": "nested",  // Nested 필드 타입 지정
        "properties": {
          "user_id": {
            "type": "text"
          },
          "comment": {
            "type": "text"
          },
          "rating": {
            "type": "integer"
          }
        }
      }
    }
  }
}
```
이 코드는 Elasticsearch에 `products` 인덱스를 생성하고, `reviews` 필드를 Nested 타입으로 정의합니다. 각 리뷰는 `user_id`, `comment`, `rating` 필드를 포함합니다.
##### 데이터 인덱싱
다음으로, 생성한 인덱스에 실제 데이터를 입력합니다.
```bash
POST /products/_doc/1
{
  "product_id": "12345",
  "reviews": [
    {
      "user_id": "user1",
      "comment": "Great product!",
      "rating": 5
    },
    {
      "user_id": "user2",
      "comment": "Not what I expected.",
      "rating": 2
    }
  ]
}
```
이 예시는 제품 ID가 `12345`인 제품에 대한 두 개의 리뷰를 `products` 인덱스에 저장합니다.
#### + Nested 쿼리로 데이터 조회하기
이제 저장된 데이터 중에서 특정 조건을 만족하는 리뷰를 조회하는 Nested 쿼리를 실행해 보겠습니다.
```bash
GET /products/_search
{
  "query": {
    "nested": {
      "path": "reviews",
      "query": {
        "bool": {
          "must": [
            {
              "match": {
                "reviews.rating": 5
              }
            }
          ]
        }
      }
    }
  }
}
```
이 쿼리는 `reviews` 필드 내에서 `rating`이 5인 리뷰를 포함하는 모든 문서를 찾습니다. `nested` 쿼리는 `path`를 사용하여 중첩 필드의 경로를 지정하고, `bool`과 `match` 쿼리를 조합하여 복잡한 조건을 적용할 수 있습니다.

이 코드를 통해 Elasticsearch에서 Nested 필드 타입의 인덱싱과 쿼리 과정을 이해하고 구현할 수 있습니다.
### 결론
Nested 필드 타입은 Elasticsearch에서 중첩된 배열 데이터를 효과적으로 관리하고, 복잡한 쿼리를 수행할 수 있게 해주는 고급 기능입니다. 데이터가 계층적인 관계를 갖고 각 계층 내의 독립성을 유지해야 할 필요가 있을 때, Nested 필드 타입을 사용하는 것이 매우 유용합니다.

## `object` vs `nested` 타입
`object`와 `nested` 타입의 차이점은 결국 **"문서의 개별성을 보장하는 가"** 의 차이 입니다.
아래 예시를 통해 그 차이를 더 살펴보겠습니다.
### Object 타입 예시
Elasticsearch에서 `object` 타입은 JSON 오브젝트를 저장할 수 있지만, 내부 필드들은 독립적인 문서로 인식되지 않습니다. 즉, 내부 필드는 상호 독립적이지 않으며 쿼리 시에 각 필드가 함께 관련된 정보를 유지하지 않습니다.
```bash
PUT /object_example
{
  "mappings": {
    "properties": {
      "user": {
        "type": "object",
        "properties": {
          "first_name": {
            "type": "text"
          },
          "last_name": {
            "type": "text"
          }
        }
      }
    }
  }
}

POST /object_example/_doc/1
{
  "user": [
  {
    "first_name": "John",
    "last_name": "Doe"
  },
  {
    "first_name": "Jane",
    "last_name": "Doe"
  }
  ]
}

POST /object_example/_doc/2
{
  "user": [
    {
      "first_name": "John",
      "last_name": "Smith"
    },
    {
      "first_name": "Jane",
      "last_name": "Doe"
    }
  ]
}
```
여기서 `first_name`과 `last_name`은 같은 오브젝트 안에 있지만, 이들 간의 연관성은 쿼리에 직접적으로 반영되지 않습니다.
실제로 `GET`을 통해 아래 검색을 수행하면 모든 문서가 검색되는 것을 볼 수 있습니다. "John", "Doe" 둘 중 하나라도 걸리면 해당 문서를 검색해오는 것 입니다. 만약 `first_name`과 `last_name`의 연관성을 인식한다면, "John", "Doe"둘의 관계(first-last name)를 고려해, 두 필드(`first_name`, `last_name`)를 모두 만족하는 1개의 문서만 검색이 되어야 할 것 입니다.
```bash
GET /object_example/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "user.first_name": "John"
          }
        },
        {
          "match": {
            "user.last_name": "Doe"
          }
        }
      ]
    }
  }
}

# 검색 결과
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
      "value": 2,
      "relation": "eq"
    },
    "max_score": 0.43301374,
    "hits": [
      {
        "_index": "object_example",
        "_id": "1",
        "_score": 0.43301374,
        "_source": {
          "user": [
            {
              "first_name": "John",
              "last_name": "Doe"
            },
            {
              "first_name": "Jane",
              "last_name": "Doe"
            }
          ]
        }
      },
      {
        "_index": "object_example",
        "_id": "2",
        "_score": 0.36464313,
        "_source": {
          "user": [
            {
              "first_name": "John",
              "last_name": "Smith"
            },
            {
              "first_name": "Jane",
              "last_name": "Doe"
            }
          ]
        }
      }
    ]
  }
}
```
### Nested 타입 예시
반면, `nested` 타입은 내부 오브젝트가 각각 독립된 문서로 취급됩니다. 이는 내부 오브젝트 간의 관계를 쿼리할 때 중요하며, 각 내부 오브젝트는 독립적인 경로를 유지합니다.
아래의 예시와 같이 `user` 필드가 `nested` 타입으로 설정되어 있기 때문에, 각 사용자는 독립된 하위 문서로 취급됩니다. 따라서, "John"과 "Jane"의 정보가 서로 독립적으로 존재하며, 이들 사이의 연관성을 쿼리에서 명시적으로 처리할 수 있습니다.
```bash
PUT /nested_example
{
  "mappings": {
    "properties": {
      "user": {
        "type": "nested",
        "properties": {
          "first_name": {
            "type": "text"
          },
          "last_name": {
            "type": "text"
          }
        }
      }
    }
  }
}

POST /nested_example/_doc/1
{
  "user": [
    {
      "first_name": "John",
      "last_name": "Doe"
    },
    {
      "first_name": "Jane",
      "last_name": "Doe"
    }
  ]
}

POST /nested_example/_doc/2
{
  "user": [
    {
      "first_name": "John",
      "last_name": "Smith"
    },
    {
      "first_name": "Jane",
      "last_name": "Doe"
    }
  ]
}
```
실제로 `GET`을 통해 아래 검색을 수행하면 `object` 타입과 다르게 1개만 검색되는 것을 볼 수 있습니다.  `first_name`과 `last_name`의 연관성을 인식해 둘 모두에 매칭되는 검색결과인 1건 만 반환하는 것입니다.
```bash
GET /nested_example/_search
{
  "query": {
    "nested": {
      "path": "user",
      "query": {
        "bool": {
          "must": [
            {
              "match": {
                "user.first_name": "John" 
              }
            },
            {
              "match": {
                "user.last_name": "Doe" 
              }
            }
          ]
        }
      }
    }
  }
}

# 검색 결과
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
    "max_score": 1.0498221,
    "hits": [
      {
        "_index": "nested_example",
        "_id": "1",
        "_score": 1.0498221,
        "_source": {
          "user": [
            {
              "first_name": "John",
              "last_name": "Doe"
            },
            {
              "first_name": "Jane",
              "last_name": "Doe"
            }
          ]
        }
      }
    ]
  }
}
```
이 차이점이 바로 개별성을 보존하는지 여부로, `nested` 타입을 사용하면 복잡한 데이터 구조 속에서 각 데이터의 관계를 정확하게 유지할 수 있습니다.