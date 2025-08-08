import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Headers, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }
}
