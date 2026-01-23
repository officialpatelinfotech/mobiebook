import { Injectable } from '@angular/core';
import { ApiLink } from '../models/apilink.metadata';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class CouponService {
    api: ApiLink = new ApiLink();

    constructor(private apiService: ApiService) { }

    addCoupon(data) {
        this.api.MethodName = 'Coupon/AddCoupon';
        this.api.Param = data;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }

    getCoupons(data) {
        this.api.MethodName = 'Coupon/AcGetCoupon';
        this.api.Param = data;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }

    getCouponDetailById(id) {
        this.api.MethodName = `Coupon/GetCouponById?couponId=${id}`;
        return this.apiService.getData<any>(this.api.MethodName);
    }

    deleteCoupon(id) {
        this.api.MethodName = 'Coupon/DeleteCoupon';
        this.api.Param = id;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }

    getCustomerCoupon(){
        this.api.MethodName = `Coupon/GetCustomerCoupon`;
        return this.apiService.getData<any>(this.api.MethodName);
    }

    buyCoupon(buyDetail) {
        this.api.MethodName = 'Coupon/AcBuyCoupon';
        this.api.Param = buyDetail;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }

    acGetCart() {
        this.api.MethodName = 'Coupon/AcCartDetail';
        this.api.Param = null;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }

    removeCartItem(requestId){
        this.api.MethodName = 'Coupon/DeleteCartItem';
        this.api.Param = requestId;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }

    updateCartStatus(data){
        this.api.MethodName = 'Coupon/UpdateCartStatus';
        this.api.Param = data;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }

    customerRequestedCoupon(detail) {
        this.api.MethodName = 'Coupon/AcCouponRequest';
        this.api.Param = detail;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }

    customerAllRequestedCoupon(detail) {
        this.api.MethodName = 'Coupon/AcGetCustomerCouponRequest';
        this.api.Param = detail;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }

    approveBulkRequest(data){
        this.api.MethodName = 'Coupon/AcGetCustomerApproved';
        this.api.Param = data;
        return this.apiService.postData<any>(this.api.MethodName, this.api.Param);
    }
}