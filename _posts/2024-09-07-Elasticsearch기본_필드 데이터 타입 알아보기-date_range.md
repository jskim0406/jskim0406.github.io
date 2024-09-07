---
layout: post
title: Elasticsearch - 필드 데이터 타입 알아보기 - (5) `date`, `range`
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
PUT /sample-index
{
  "mappings": {
    "properties": {
      "event_date": {
        "type": "date",
        "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
      }
    }
  }
}

POST /sample-index/_doc/1
{
  "event_date": "2023-09-12 20:45:00"
}

POST /sample-index/_doc/2
{
  "event_date": "2023-09-12"
}

POST /sample-index/_doc/3
{
  "event_date": 1662993600000
}

PUT /example_index
{
  "mappings": {
    "properties": {
      "availability": {
        "type": "date_range",
        "format": "yyyy-MM-dd"
      },
      "allowed_ip": {
        "type": "ip_range"
      }
    }
  }
}

PUT /example_index/_doc/1
{
  "event_name": "Tech Conference",
  "availability": {
    "gte": "2023-10-01",
    "lte": "2023-10-07"
  },
  "allowed_ip": {
    "gte": "192.168.1.1",
    "lte": "192.168.1.255"
  }
}

GET /example_index/_doc/1

POST /example_index/_search
{
  "query": {
    "range": {
      "availability": {
        "gte": "2023-10-03",
        "lte": "2023-10-03",
        "format": "yyyy-MM-dd"
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

## `date` 타입
### Elasticsearch의 `date` 필드 타입 이해

Elasticsearch에서 날짜와 시간 데이터를 다루는 방법은 매우 중요하며, `date` 필드 타입은 이를 효과적으로 처리하기 위한 핵심적인 기능을 제공합니다. 이 필드 타입을 이해하고 올바르게 사용하는 것은 시간 기반의 데이터 분석과 쿼리를 수행할 때 필수적입니다. 이번 포스팅에서는 `date` 필드 타입의 특징과 설정 방법을 상세히 살펴보겠습니다.

### `date` 필드 타입의 기본 작동 원리

#### UTC로의 변환
Elasticsearch에서 모든 날짜 데이터는 내부적으로 세계 표준시(UTC)로 변환되어 처리됩니다. 이는 지역 시간대의 영향을 받지 않고 일관된 시간 데이터 처리를 가능하게 합니다. 사용자가 어떤 시간대에서 데이터를 입력하든, Elasticsearch는 그것을 UTC로 변환하여 내부적으로 저장합니다.

#### JSON에서의 표현
JSON 형식에서 날짜는 문자열로 표현됩니다. 이 문자열은 Elasticsearch에 의해 파싱되고, 내부적으로는 UTC의 밀리초 단위로 변환되어 저장됩니다. 이 과정은 매우 투명하게 이루어지며, 사용자는 간단하게 문자열 형태로 날짜 데이터를 제공하기만 하면 됩니다.

### 매핑 설정에서의 날짜 포맷 지정

#### 기본 포맷
Elasticsearch의 기본 날짜 포맷은 `yyyy-MM-ddTHH:mm:ssZ` 입니다. 이 포맷은 국제적으로 널리 사용되며, 대부분의 기본적인 날짜와 시간 데이터를 효과적으로 처리할 수 있습니다.

#### 포맷 명시
사용자는 매핑 설정 시 날짜 데이터가 어떤 형식으로 입력될지를 명시할 수 있습니다. 이는 매우 중요한 설정으로, 데이터의 일관성과 정확한 파싱을 보장하는 데 필수적입니다. 예를 들어, 다음과 같이 여러 개의 날짜 포맷을 동시에 지정할 수 있습니다.

```json
"format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
```

이 설정은 Elasticsearch가 `yyyy-MM-dd HH:mm:ss`, `yyyy-MM-dd`, 그리고 에포크 시간(밀리초)으로 표현된 시간을 모두 인식하고 올바르게 처리할 수 있게 합니다. 이러한 유연성은 다양한 소스에서 오는 날짜 데이터를 효과적으로 통합하고 검색할 수 있게 도와줍니다.

### 결론

Elasticsearch의 `date` 필드 타입은 데이터의 정확한 시간 정보를 저장하고 쿼리하는 데 필수적인 도구입니다. UTC로의 자동 변환, 다양한 날짜 포맷의 지원 등은 Elasticsearch를 강력한 시간 기반 데이터 분석 툴로 만들어 줍니다. 올바른 날짜 포맷 설정은 데이터의 일관성을 유지하고, 시간에 따른 분석과 검색 작업을 효과적으로 수행할 수 있게 합니다. 이러한 설정을 통해 사용자는 전 세계 어디서나 일관된 데이터 처리와 분석 경험을 할 수 있습니다.

Elasticsearch에서 날짜 필드를 설정할 때, 다양한 날짜 형식을 지원하도록 `format` 매개변수를 사용하는 것은 매우 유용합니다. 여기에서는 사용자가 "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd", 그리고 "epoch_millis" 형식의 날짜 데이터를 입력할 수 있도록 `date` 필드를 설정하는 방법을 설명합니다. 이는 특히 다양한 소스에서 오는 데이터를 통합할 때 효과적입니다.

### Elasticsearch에 `date` 필드 설정 예시
#### 인덱스 생성 및 매핑 설정
다음은 새로운 인덱스를 생성하면서 `date` 필드에 대해 여러 날짜 포맷을 지원하는 설정을 포함하는 예시입니다.
```plaintext
PUT /sample-index
{
  "mappings": {
    "properties": {
      "event_date": {
        "type": "date",
        "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
      }
    }
  }
}
```
이 예시에서, `sample-index`라는 인덱스에 `event_date`라는 필드를 `date` 타입으로 설정합니다. `format` 속성을 통해 세 가지 날짜 형식을 지정하여, 이 필드에는 "2023-09-12 15:00:00", "2023-09-12", 또는 밀리초 단위의 타임스탬프(예: 1662993600000)를 사용할 수 있습니다.

#### 데이터 색인 예시
이 설정이 완료된 후, 다양한 형식의 날짜 데이터를 `sample-index`에 색인할 수 있습니다. 다음은 세 가지 형식의 날짜 데이터를 각각 색인하는 예시입니다.
```plaintext
PUT /sample-index/_doc/1
{
  "event_date": "2023-09-12 20:45:00"
}

PUT /sample-index/_doc/2
{
  "event_date": "2023-09-12"
}

PUT /sample-index/_doc/3
{
  "event_date": 1662993600000
}
```

각 색인 요청은 `event_date` 필드에 다른 형식의 날짜 데이터를 사용합니다. Elasticsearch는 이를 자동으로 인식하고, 설정된 포맷에 따라 내부적으로 UTC로 변환하여 저장합니다.

### 결론
위와 같이 설정하면, Elasticsearch에서 다양한 형식의 날짜 데이터를 유연하게 색인하고 검색할 수 있습니다. 이러한 유연성은 데이터 처리 및 통합 작업에서 매우 유용하며, 시간 데이터를 다루는 모든 애플리케이션에 필수적입니다. 이 방식을 통해 데이터의 정확성과 접근성을 보장할 수 있습니다.

## `range` 타입
### Elasticsearch에서의 Range 필드 타입 이해

데이터를 효과적으로 관리하고 검색하는 것은 정보 기반 의사결정 과정에서 핵심적인 역할을 합니다. Elasticsearch에서는 특정 범위의 데이터를 효율적으로 저장하고 검색할 수 있도록 `range` 필드 타입을 제공합니다. 이 필드 타입은 연속적인 데이터의 범위를 효과적으로 처리할 수 있게 해주며, 다양한 응용 프로그램에서 유용하게 사용됩니다.

### Range 필드 타입의 개념과 작동 방식

`range` 필드 타입은 시작 값과 끝 값만을 저장하여 데이터의 범위를 나타냅니다. 이 필드 타입은 숫자, 날짜, IP 주소 등 다양한 데이터 유형에 대한 범위를 지정할 수 있으며, 특정 조건을 만족하는 데이터를 효율적으로 검색할 수 있습니다.

#### 주요 사용 사례
1. **게시물의 게시 기간**: 웹사이트나 앱에서 특정 기간 동안만 게시되어야 하는 컨텐츠의 관리에 유용합니다.
  ```json
   "publish_period": {
     "type": "date_range",
     "format": "yyyy-MM-dd"
   }
  ```

2. **허용 IP 범위**: 네트워크 관리 및 보안 시스템에서 특정 IP 범위를 설정하여 접근을 제한하거나 허용합니다.
  ```json
   "ip_range": {
     "type": "ip_range"
   }
  ```

3. **가격 필터**: 전자 상거래 플랫폼에서 사용자가 설정한 가격 범위 내의 제품만을 보여줄 때 사용됩니다.
  ```json
   "price_range": {
     "type": "double_range"
   }
  ```

#### `range` 타입 종류 및 표기
Elasticsearch에서 `range` 필드 타입을 사용할 때는 다양한 유형의 데이터에 대한 범위 지정을 지원하기 위해 특별히 설계된 여러 범위 데이터 타입이 있습니다. 각각은 특정 데이터 유형에 최적화되어 있어, 보다 정확하고 효율적인 데이터 처리를 가능하게 합니다. 여기에는 `date_range`, `ip_range`, `integer_range`, `float_range`, `long_range`, `double_range` 등이 포함됩니다.
##### 각 Range 타입의 용도
1. **`date_range`**: 날짜와 시간 범위를 저장하고 검색할 때 사용합니다. 이 타입은 날짜 형식의 데이터에 대한 시작 및 종료 범위를 처리합니다.

2. **`ip_range`**: IP 주소 범위를 저장하고 검색할 때 사용합니다. 네트워크 관리나 보안 관련 기능에서 유용하게 쓰일 수 있습니다.

3. **`integer_range`, `float_range`, `long_range`, `double_range`**: 이들 타입은 각각 정수, 부동 소수점 수, 긴 정수, 배정밀도 부동 소수점 수 범위를 처리합니다. 가격 필터링이나 수치적 매개변수의 범위를 지정할 때 사용됩니다.

##### 예시: 범위 필드 정의
다음은 `date_range`와 `ip_range`를 사용하는 방법을 보여주는 JSON 매핑 예시입니다:

```plaintext
PUT /example_index
{
  "mappings": {
    "properties": {
      "availability": {
        "type": "date_range",
        "format": "yyyy-MM-dd"
      },
      "allowed_ip": {
        "type": "ip_range"
      }
    }
  }
}
```
이 예시에서 `availability` 필드는 `date_range` 타입으로 정의되어 있으며, `allowed_ip` 필드는 `ip_range` 타입으로 설정되어 있습니다. 각 필드는 그에 맞는 데이터 유형의 범위를 저장하고 쿼리할 수 있도록 설계되었습니다.

### 검색 시 Range 필드 활용 방법
Elasticsearch에서 `range` 필드를 사용한 검색 쿼리는 `relation` 매개변수를 사용하여 범위와의 관계를 명시할 수 있습니다. `relation` 필드는 `within`, `contains`, `intersects` 등의 값을 사용하여 검색 조건을 세밀하게 조정할 수 있습니다.
#### 예시
위 `range`필드에 새로운 문서를 삽입하는 과정은 아래와 같습니다.
```plaintext
PUT /example_index/_doc/1
{
  "event_name": "Tech Conference",
  "availability": {
    "gte": "2023-10-01",
    "lte": "2023-10-07"
  },
  "allowed_ip": {
    "gte": "192.168.1.1",
    "lte": "192.168.1.255"
  }
}
```
삽입된 `range`필드의 문서를 조회하는 과정은 아래와 같습니다.
```plaintext
GET /example_index/_doc/1

POST /example_index/_search
{
  "query": {
    "range": {
      "availability": {
        "gte": "2023-10-03",
        "lte": "2023-10-03",
        "format": "yyyy-MM-dd"
      }
    }
  }
}
```
아래와 같은 조건으로 조회하는 검색 결과는 존재하지 않습니다.
`example_index`의 "availability" range와 조회 query range 조건이 겹치지 않기 때문입니다.
```plaintext
POST /example_index/_search
{
  "query": {
    "range": {
      "availability": {
        "gte": "2023-10-09",
        "lte": "2023-10-10",
        "format": "yyyy-MM-dd"
      }
    }
  }
}
```
### 결론
`range` 필드 타입은 Elasticsearch에서 범위 데이터를 효율적으로 처리하고 검색할 수 있는 강력한 도구입니다. 이를 통해 사용자는 데이터를 더 세밀하게 조회하고 관리할 수 있으며, 특히 날짜, 가격, IP 주소 등의 범위를 다루는 애플리케이션에서 그 효용성이 큽니다. 데이터의 범위를 지정하여 검색하고자 하는 모든 이에게 `range` 필드 타입은 높은 가치를 제공합니다.