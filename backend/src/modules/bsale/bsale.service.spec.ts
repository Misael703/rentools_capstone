import { Test, TestingModule } from '@nestjs/testing';
import { BsaleService } from './bsale.service';

describe('BsaleService', () => {
  let service: BsaleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BsaleService],
    }).compile();

    service = module.get<BsaleService>(BsaleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
