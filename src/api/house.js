import request from '../utils/request'

// 查询所有房屋
export function listHouses() {
  return request.get('/houses')
}

// 根据ID查询房屋
export function getHouseById(id) {
  return request.get(`/houses/${id}`)
}

// 创建房屋（后端使用 @RequestBody）
export function createHouse(data) {
  return request.post('/houses', data)
}

// 删除房屋
export function deleteHouse(id) {
  return request.delete(`/houses/${id}`)
}