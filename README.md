## Process

### Run test node

노드실행

```
docker run --rm -p 30000-30003:30000-30003 -d iostio/iost-node
```

먼저 admin 유저를 import 한다.

```sh
sudo iwallet account import admin 2yquS3ySrGWPEKywCPzX4RTJugqRh7kJSo5aehsLYPEWkUxBWA39oMrZ7ZxuM4fgyXYs2cPwh5n8aNNpH5x2VyK1
```

그 뒤 유저를 생성한다.

```shell
iwallet --account admin --amount_limit "ram:1000|iost:10" account create test --initial_balance 1000 --initial_gas_pledge 10 --initial_ram 1024
```

account: who create the new account	< user specified >
initial_ram: ram amount bought for new account by creator
initial_gas_pledge: IOST amount pledged for gas for new account by creator
initial_balance: IOST amount transferred to new account by creator


## Problem solving

Transaction 생성 후 바로 네트워크로 요청을 보내니 계속 "TimeError" 라는 에러가 났다.

소스코드를 살펴보니, 바로 보내면 나는 에러고 최소 1초의 딜레이를 주어야 한다고 되어있다.