KVDB 的 Usage Examples / 使用示例

KVDB是一个基于HTTP的KV存储服务，它提供了简单的API来存储和检索键值对。

假定服务在 https://your-project.edgeone.app 部署，下列操作是服务的使用示例。

X-KV-KEY是用于和KV存储服务进行交互的密钥，它必须在请求头中包含。
user1是一个示例键，你可以替换为你自己的键。

1. Create (POST) - 创建一个键值对，如果已经存在则会报错
curl -X POST https://your-project.edgeone.app/api/user1 \
  -H "X-KV-KEY: mysecret" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "age": 30}'
2. Read (GET) - 获取一个键值对，如果不存在则会报错
curl -X GET https://your-project.edgeone.app/api/user1 \
  -H "X-KV-KEY: mysecret"
3. Update (PUT) - 更新一个键值对，如果不存在则会报错    
curl -X PUT https://your-project.edgeone.app/api/user1 \
  -H "X-KV-KEY: mysecret" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "age": 31}'
4. Delete (DELETE) - 删除一个键值对，如果不存在则会报错
curl -X DELETE https://your-project.edgeone.app/api/user1 \
  -H "X-KV-KEY: mysecret"