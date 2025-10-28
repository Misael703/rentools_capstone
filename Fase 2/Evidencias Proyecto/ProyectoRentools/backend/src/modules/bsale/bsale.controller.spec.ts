import { Test, TestingModule } from '@nestjs/testing';
import { BsaleController } from './bsale.controller';
import { BsaleService } from './bsale.service';

describe('BsaleController', () => {
  let controller: BsaleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BsaleController],
      providers: [BsaleService],
    }).compile();

    controller = module.get<BsaleController>(BsaleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
