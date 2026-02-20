import request from '../utils/request'

// 查询所有租客（支持分页和排序）
export function listTenants(params) {
  return request.get('/tenants', { params })
}

// 查询某房屋下所有租客（支持分页和排序）
export function listTenantsByHouse(houseId, params) {
  return request.get(`/tenants/house/${houseId}`, { params })
}

// 根据ID查询租客
export function getTenantById(id) {
  return request.get(`/tenants/${id}`)
}

// 添加租客（后端使用 @RequestBody）
export function addTenant(data) {
  return request.post('/tenants', data)
}

// 租客退房（后端使用 @RequestParam）
export function checkoutTenant(id, checkOutDate) {
  return request.put(`/tenants/${id}/checkout`, null, {
    params: { checkOutDate }
  })
}

// 删除租客
export function deleteTenant(id) {
  return request.delete(`/tenants/${id}`)
}