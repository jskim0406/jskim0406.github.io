---
layout: post
title: Elasticsearch - 인덱스 템플릿(index template, component template)
author: jskim
featuredImage: null
img: null
tags: Elasticsearch, Retrieval
categories: Retrieval
date: '2024-11-04 00:25:00 +0900'
---

#### Reference
- https://github.com/nobaksan/fastcampus-elasticsearch-part1
- https://github.com/munkyu/fastcampus-es
- https://github.com/kkdeok/fastcampus-elasticsearch

## 오늘의 API
### Component Template 관리
```bash
# settings component template 생성
PUT _component_template/settings-template
{
  "template": {
    "settings": {
      "number_of_shards": 2,
      "number_of_replicas": 1,
      "refresh_interval": "30s"
    }
  }
}

# mappings component template 생성
PUT _component_template/mappings-template
{
  "template": {
    "mappings": {
      "properties": {
        "@timestamp": {
          "type": "date"
        },
        "message": {
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

# aliases component template 생성
PUT _component_template/aliases-template
{
  "template": {
    "aliases": {
      "logs-write": {}
    }
  }
}

# component template 조회
GET _component_template/settings-template

# component template 삭제
DELETE _component_template/settings-template
```

### Index Template 관리
```bash
# index template 생성 (단일)
PUT _index_template/logs-template
{
  "index_patterns": ["logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 1
    },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "message": { "type": "text" }
      }
    },
    "aliases": {
      "logs": {}
    }
  }
}

# index template 생성 (component template 조합)
PUT _index_template/composed-logs-template
{
  "index_patterns": ["logs-*"],
  "priority": 500,
  "composed_of": [ 
    "settings-template",
    "mappings-template",
    "aliases-template"
  ],
  "template": {
    "settings": {
      "index.lifecycle.name": "logs-policy"
    }
  }
}

# index template 조회
GET _index_template/logs-template

# 모든 index template 조회
GET _index_template

# index template 삭제
DELETE _index_template/logs-template
```

### Template이 적용된 새 인덱스 생성
```bash
# template 패턴과 일치하는 인덱스 생성
PUT logs-2024-01-01
{
  "settings": {
    "refresh_interval": "5s"  # template의 다른 설정은 유지하면서 일부만 오버라이드
  }
}

# 생성된 인덱스의 settings 확인
GET logs-2024-01-01/_settings

# 생성된 인덱스의 mapping 확인
GET logs-2024-01-01/_mapping
```

### Template 우선순위 확인
```bash
# 우선순위가 다른 여러 template 생성
PUT _index_template/logs-base
{
  "index_patterns": ["logs-*"],
  "priority": 0,
  "template": {
    "settings": {
      "number_of_shards": 1
    }
  }
}

PUT _index_template/logs-prod
{
  "index_patterns": ["logs-prod-*"],
  "priority": 100,
  "template": {
    "settings": {
      "number_of_shards": 3
    }
  }
}
```

---

## Index Template이란?

Index Template은 새로운 인덱스가 생성될 때 자동으로 적용될 설정과 매핑을 미리 정의해두는 기능입니다. 특정 패턴의 이름을 가진 인덱스가 생성될 때 자동으로 이 템플릿의 설정이 적용되므로, 관리자는 반복적인 설정 작업에서 벗어날 수 있습니다.

## Index Template의 주요 구성 요소

### 1. Mappings
- 필드의 데이터 타입과 속성을 정의
- 검색과 집계에 필요한 필드 설정
- 분석기 설정 등

```bash
{
  "mappings": {
    "properties": {
      "timestamp": {
        "type": "date"
      },
      "message": {
        "type": "text",
        "analyzer": "standard"
      },
      "level": {
        "type": "keyword"
      }
    }
  }
}
```

### 2. Settings
- 샤드 수
- 레플리카 수
- 리프레시 주기
- 기타 인덱스 관련 설정

```bash
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "refresh_interval": "5s"
  }
}
```

### 3. Aliases
- 인덱스의 별칭 지정
- 여러 인덱스를 하나의 별칭으로 관리 가능

```bash
{
  "aliases": {
    "logs_alias": {}
  }
}
```

## Index Template의 종류

### 1. Index Template
- 정적인 인덱스 템플릿
- 특정 패턴의 인덱스에 대해 기본 설정 제공
- 예: `logs-*`, `metrics-*` 등의 패턴 매칭

```bash
PUT _index_template/logs_template
{
  "index_patterns": ["logs-*"],
  "template": {
    "mappings": {
      "properties": {
        "timestamp": { "type": "date" },
        "message": { "type": "text" }
      }
    }
  }
}
```

### 2. Component Template
- 재사용 가능한 템플릿 컴포넌트
- 여러 Index Template에서 공통으로 사용 가능
- 모듈화된 설정 관리 가능

```bash
PUT _component_template/logging_settings
{
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 1
    }
  }
}
```

## Template 우선순위

여러 템플릿이 동일한 패턴에 매칭될 경우, 우선순위에 따라 적용됩니다:

1. 직접 지정된 인덱스 설정
2. 가장 높은 우선순위를 가진 템플릿
3. 다음 우선순위의 템플릿들
4. 기본 설정

## 실제 활용 사례

### 로그 데이터 관리

```bash
PUT _index_template/daily_logs
{
  "index_patterns": ["logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 1,
      "refresh_interval": "30s"
    },
    "mappings": {
      "properties": {
        "@timestamp": {
          "type": "date"
        },
        "message": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "level": {
          "type": "keyword"
        }
      }
    },
    "aliases": {
      "logs_current": {}
    }
  }
}
```