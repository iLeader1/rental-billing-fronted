import request from '../utils/request'

// 查询所有账单
export function listBills() {
  return request.get('/bills')
}

// 查询某房屋的所有账单
export function listBillsByHouse(houseId) {
  return request.get(`/bills/house/${houseId}`)
}

// 查询账单分摊详情
export function getBillDetail(billId) {
  return request.get(`/bills/${billId}/detail`)
}

// 录入账单并自动分摊（后端使用 @RequestBody）
export function createBill(data) {
  return request.post('/bills', data)
}

// 删除账单
export function deleteBill(id) {
  return request.delete(`/bills/${id}`)
}