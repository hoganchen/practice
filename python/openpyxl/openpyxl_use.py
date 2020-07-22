# -*- coding:utf-8 -*-

import os
import re
import time
import logging
# import datetime
import argparse
import openpyxl
import openpyxl.styles

REGION_COLUMN_NUM = 8
REGION_SIZE_INDEX = 2
REGION_TYPE_INDEX = 3
REGION_PAD_STRING = 'PAD'

BLE_STACK_SIZE = 16 * 1024

LIB_FILE_LIST = ('ble_sdk_gr551x_d.lib', 'ble_sdk_gr551x_c.lib', 'ble_sdk_gr551x.lib')
OTHERS_EXTEND_LIST = ('main.o',)
DRIVER_DIR_LIST = ('drivers', 'components\\app_drivers', 'components\\drivers_ext')
OTHER_DIR_LIST = ('components\\profiles', 'components\\libraries', 'external', 'toolchain')

MAP_FILE_SUFFIX = '.map'
C_FILE_SUFFIX = '.c'

# log level
LOGGING_LEVEL = logging.INFO


def logging_config(logging_level):
    # log_format = "%(asctime)s - %(levelname)s - %(message)s"
    # log_format = "%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s"
    log_format = "[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s"
    logging.basicConfig(level=logging_level, format=log_format)


def get_all_files_with_suffix_by_os_walk(dir_path, suffix=None):
    file_path_list = []

    if os.path.exists(dir_path) and os.path.isdir(dir_path):
        for folder, sub_folder, file_list in os.walk(dir_path):
            # logging.debug('folder: {}, sub_folder: {}, file_list: {}'.format(folder, sub_folder, file_list))

            for file_name in file_list:
                file_path = os.path.join(folder, file_name)

                if suffix is None:
                    file_path_list.append(file_path)
                else:
                    # if re.search(r'{}$'.format(re.escape(suffix)), os.path.split(file_path)[1]):
                    if re.search(r'{}$'.format(suffix), os.path.split(file_path)[1]):
                        file_path_list.append(file_path)

    logging.debug('file list: {}'.format(file_path_list))
    return file_path_list


def get_all_path_files_with_suffix_by_os_walk(dir_path_list, suffix=None):
    file_path_list = []

    for dir_path in dir_path_list:
        file_path_list.extend(get_all_files_with_suffix_by_os_walk(dir_path, suffix))

    return file_path_list


def parse_map_file(file_name):
    region_flag = False
    region_name = None
    region_dict = {}

    info_dict = {}

    with open(file_name) as map_fd:
        while True:
            line_str = map_fd.readline()

            if line_str:
                region_obj = re.match(r'^\s+Execution\s+Region\s+(\w+)', line_str)
                if region_obj:
                    region_flag = True
                    region_name = region_obj.group(1)
                    if region_dict.get(region_name) is None:
                        region_dict[region_name] = []

                if region_flag and region_name is not None:
                    line_list = line_str.split()
                    file_size_obj = re.match(r'^\s+0x[0-9a-f]{8}\s+\S+\s+0x[0-9a-f]{8}\s+\w+', line_str)

                    if file_size_obj:
                        logging.debug('len(line_list): {}, line_str: {}'.format(len(line_list), line_str))

                        if REGION_TYPE_INDEX + 1 == len(line_list) and \
                                line_list[REGION_TYPE_INDEX].upper() == REGION_PAD_STRING:
                            region_dict[region_name][-1]['size'] += int(line_list[REGION_SIZE_INDEX], 16)
                        elif REGION_COLUMN_NUM == len(line_list):
                            region_dict[region_name].append(
                                {'name': line_list[-1], 'type': line_list[REGION_TYPE_INDEX],
                                 'size': int(line_list[REGION_SIZE_INDEX], 16)})

                size_obj = re.match(r'^\s+Total\s+ROM\s+Size\s+\(Code\s+\+\s+RO\s+Data\s+\+\s+RW\s+Data\)\s+(\d+)',
                                    line_str)
                flash_obj = re.match(r'^\s+Execution\s+Region\s+FLASH_CODE\s+\(Exec\s+base:\s+(0x[0-9a-f]{8}),'
                                     r'\s+Load\s+base:\s+(0x[0-9a-f]{8})', line_str)
                ram_rw_obj = re.match(r'^\s+\d+\s+\d+\s+\d+\s+(\d+)\s+\d+\s+\d+\s+ELF\s+'
                                      r'Image\s+Totals\s*\(compressed\)', line_str)

                if size_obj:
                    info_dict['rom_size'] = size_obj.group(1)

                if flash_obj:
                    info_dict['exec_base'] = flash_obj.group(1)
                    info_dict['load_base'] = flash_obj.group(2)

                if ram_rw_obj:
                    info_dict['ram_rw_elf'] = ram_rw_obj.group(1)
            else:
                break

    logging.debug('info_dict: {}\n\n'.format(info_dict))
    logging.debug('region_dict:\n{}'.format(region_dict))
    logging.debug('\n\n')
    for key, value in region_dict.items():
        logging.debug('KEY: {}, length: {}'.format(key, len(value)))

    return info_dict, region_dict


def gen_excel_report(map_file, args_param):
    info_dict, region_dict = parse_map_file(map_file)
    driver_path_list = ['{}'.format(os.path.join(args_param.sdk_base, dir_path)) for dir_path in DRIVER_DIR_LIST]
    other_path_list = ['{}'.format(os.path.join(args_param.sdk_base, dir_path)) for dir_path in OTHER_DIR_LIST]

    driver_file_list = get_all_path_files_with_suffix_by_os_walk(driver_path_list, suffix=C_FILE_SUFFIX)
    other_file_list = get_all_path_files_with_suffix_by_os_walk(other_path_list, suffix=C_FILE_SUFFIX)

    driver_file_dict = {}
    other_file_dict = {}

    for driver_file in driver_file_list:
        driver_file_dict[os.path.basename(os.path.splitext(driver_file)[0])] = driver_file
    for other_file in other_file_list:
        other_file_dict[os.path.basename(os.path.splitext(other_file)[0])] = other_file

    logging.debug('\n\ndriver_file_dict: {}'.format(driver_file_dict))
    logging.debug('\n\nother_file_dict: {}'.format(other_file_dict))

    flash_use_dict = {'lib': 0, 'driver': 0, 'other': 0, 'user': 0}
    ram_zi_use_dict = {'lib': 0, 'driver': 0, 'other': 0, 'user': 0}
    ram_rw_use_dict = {'lib': 0, 'driver': 0, 'other': 0, 'user': 0}
    ram_code_use_dict = {'lib': 0, 'driver': 0, 'other': 0, 'user': 0}

    for flash_dict in region_dict['FLASH_CODE']:
        logging.debug('flash_dict: {}'.format(flash_dict))
        logging.debug('os.path.splitext(os.path.basename(flash_dict["name"]))[0]: {}'.
                      format(os.path.splitext(os.path.basename(flash_dict['name']))[0]))
        logging.debug('driver_file_dict.get(os.path.splitext(os.path.basename(flash_dict["name"]))[0]): {}'.
                      format(driver_file_dict.get(os.path.splitext(os.path.basename(flash_dict['name']))[0])))

        if -1 != flash_dict['name'].find('.lib'):
            flash_use_dict['lib'] += flash_dict['size']
            logging.debug('flash_use_dict["lib"]: {}'.format(flash_use_dict['lib']))
        elif driver_file_dict.get(os.path.splitext(os.path.basename(flash_dict['name']))[0]) is not None:
            flash_use_dict['driver'] += flash_dict['size']
            logging.debug('flash_use_dict["driver"]: {}'.format(flash_use_dict['driver']))
        elif other_file_dict.get(os.path.splitext(os.path.basename(flash_dict['name']))[0]) is not None:
            flash_use_dict['other'] += flash_dict['size']
        elif flash_dict['name'] in OTHERS_EXTEND_LIST:
            flash_use_dict['other'] += flash_dict['size']
        else:
            flash_use_dict['user'] += flash_dict['size']

    for ram_zi_dict in region_dict['RAM_ZI']:
        if -1 != ram_zi_dict['name'].find('.lib'):
            ram_zi_use_dict['lib'] += ram_zi_dict['size']
        elif driver_file_dict.get(os.path.splitext(os.path.basename(ram_zi_dict['name']))[0]) is not None:
            ram_zi_use_dict['driver'] += ram_zi_dict['size']
        elif other_file_dict.get(os.path.splitext(os.path.basename(ram_zi_dict['name']))[0]) is not None:
            ram_zi_use_dict['other'] += ram_zi_dict['size']
        elif ram_zi_dict['name'] in OTHERS_EXTEND_LIST:
            ram_zi_use_dict['other'] += ram_zi_dict['size']
        else:
            ram_zi_use_dict['user'] += ram_zi_dict['size']

    for ram_rw_dict in region_dict['RAM_RW']:
        if -1 != ram_rw_dict['name'].find('.lib'):
            ram_rw_use_dict['lib'] += ram_rw_dict['size']
        elif driver_file_dict.get(os.path.splitext(os.path.basename(ram_rw_dict['name']))[0]) is not None:
            ram_rw_use_dict['driver'] += ram_rw_dict['size']
        elif other_file_dict.get(os.path.splitext(os.path.basename(ram_rw_dict['name']))[0]) is not None:
            ram_rw_use_dict['other'] += ram_rw_dict['size']
        elif ram_rw_dict['name'] in OTHERS_EXTEND_LIST:
            ram_rw_use_dict['other'] += ram_rw_dict['size']
        else:
            ram_rw_use_dict['user'] += ram_rw_dict['size']

    for ram_code_dict in region_dict['RAM_CODE']:
        if -1 != ram_code_dict['name'].find('.lib'):
            ram_code_use_dict['lib'] += ram_code_dict['size']
        elif driver_file_dict.get(os.path.splitext(os.path.basename(ram_code_dict['name']))[0]) is not None:
            ram_code_use_dict['driver'] += ram_code_dict['size']
        elif other_file_dict.get(os.path.splitext(os.path.basename(ram_code_dict['name']))[0]) is not None:
            ram_code_use_dict['other'] += ram_code_dict['size']
        elif ram_code_dict['name'] in OTHERS_EXTEND_LIST:
            ram_code_use_dict['other'] += ram_code_dict['size']
        else:
            ram_code_use_dict['user'] += ram_code_dict['size']

    logging.debug('\n\nflash_use_dict: {}'.format(flash_use_dict))
    logging.debug('\n\nram_zi_use_dict: {}'.format(ram_zi_use_dict))
    logging.debug('\n\nram_rw_use_dict: {}'.format(ram_rw_use_dict))
    logging.debug('\n\nram_code_use_dict: {}'.format(ram_code_use_dict))

    print('Start to generate the parse report...', flush=True)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Parser_Result'

    ws.merge_cells('A1:A4')
    ws['A1'] = 'Bin Size'
    ws.merge_cells('B1:B4')
    ws['B1'] = 'Load Address'
    ws.merge_cells('C1:C4')
    ws['C1'] = 'Run Address'

    ws.merge_cells('D1:H1')
    ws['D1'] = 'Flash (before compression)(bytes)'
    ws.merge_cells('D2:D4')
    ws['D2'] = 'All'
    ws.merge_cells('E2:G2')
    ws['E2'] = 'SDK'
    ws.merge_cells('E3:E4')
    ws['E3'] = 'Library'
    ws.merge_cells('F3:F4')
    ws['F3'] = 'Driver'
    ws.merge_cells('G3:G4')
    ws['G3'] = 'Other'
    ws.merge_cells('H2:H4')
    ws['H2'] = 'User'

    ws.merge_cells('I1:Z1')
    ws['I1'] = 'RAM(Bytes)'
    ws.merge_cells('I2:I4')
    ws['I2'] = 'All'

    ws.merge_cells('J2:N2')
    ws['J2'] = 'RAM_ZI'
    ws.merge_cells('J3:J4')
    ws['J3'] = 'All'
    ws.merge_cells('K3:M3')
    ws['K3'] = 'SDK'
    ws.merge_cells('N3:N4')
    ws['N3'] = 'User'
    ws['K4'] = 'Library'
    ws['L4'] = 'Driver'
    ws['M4'] = 'Other'

    ws.merge_cells('O2:S2')
    ws['O2'] = 'RAM_RW'
    ws.merge_cells('O3:O4')
    ws['O3'] = 'All'
    ws.merge_cells('P3:R3')
    ws['P3'] = 'SDK'
    ws.merge_cells('S3:S4')
    ws['S3'] = 'User'
    ws['P4'] = 'Library'
    ws['Q4'] = 'Driver'
    ws['R4'] = 'Other'

    ws.merge_cells('T2:X2')
    ws['T2'] = 'RAM_CODE'
    ws.merge_cells('T3:T4')
    ws['T3'] = 'All'
    ws.merge_cells('U3:W3')
    ws['U3'] = 'SDK'
    ws.merge_cells('X3:X4')
    ws['X3'] = 'User'
    ws['U4'] = 'Library'
    ws['V4'] = 'Driver'
    ws['W4'] = 'Other'

    ws.merge_cells('Y2:Y4')
    ws['Y2'] = 'RAM_USED_IN_ROM'
    ws.merge_cells('Z2:Z4')
    ws['Z2'] = 'Call Stack'

    bd = openpyxl.styles.Side(border_style='thin')
    for cell_column in [chr(i) for i in range(65, 91)]:
        ws.column_dimensions['{}'.format(cell_column)].width = 12

        for cell_row in range(1, 6):
            ws['{}{}'.format(cell_column, cell_row)].border = \
                openpyxl.styles.Border(left=bd, right=bd, top=bd, bottom=bd)
            ws['{}{}'.format(cell_column, cell_row)].alignment = \
                openpyxl.styles.Alignment(horizontal='center', vertical='center', wrapText=True)

    ws['A5'] = '{} bytes'.format(info_dict['rom_size'])
    if info_dict.get('load_base') is not None:
        ws['B5'] = info_dict['load_base']
    if info_dict.get('exec_base') is not None:
        ws['C5'] = info_dict['exec_base']

    ws['D5'] = flash_use_dict['lib'] + flash_use_dict['driver'] + flash_use_dict['other'] + flash_use_dict['user'] + \
        ram_rw_use_dict['lib'] + ram_rw_use_dict['driver'] + ram_rw_use_dict['other'] + ram_rw_use_dict['user'] +\
        ram_code_use_dict['lib'] + ram_code_use_dict['driver'] + ram_code_use_dict['other'] + \
        ram_code_use_dict['user']
    ws['E5'] = flash_use_dict['lib'] + ram_rw_use_dict['lib'] + ram_code_use_dict['lib']
    ws['F5'] = flash_use_dict['driver'] + ram_rw_use_dict['driver'] + ram_code_use_dict['driver']
    ws['G5'] = flash_use_dict['other'] + ram_rw_use_dict['other'] + ram_code_use_dict['other']
    ws['H5'] = flash_use_dict['user'] + ram_rw_use_dict['user'] + ram_code_use_dict['user']

    ws['I5'] = ram_zi_use_dict['lib'] + ram_zi_use_dict['driver'] + ram_zi_use_dict['other'] + \
        ram_zi_use_dict['user'] + ram_rw_use_dict['lib'] + ram_rw_use_dict['driver'] + \
        ram_rw_use_dict['other'] + ram_rw_use_dict['user'] + ram_code_use_dict['lib'] + \
        ram_code_use_dict['driver'] + ram_code_use_dict['other'] + ram_code_use_dict['user'] + BLE_STACK_SIZE + \
        region_dict['ARM_LIB_STACKHEAP'][0]['size']
    ws['J5'] = ram_zi_use_dict['lib'] + ram_zi_use_dict['driver'] + ram_zi_use_dict['other'] + ram_zi_use_dict['user']
    ws['K5'] = ram_zi_use_dict['lib']
    ws['L5'] = ram_zi_use_dict['driver']
    ws['M5'] = ram_zi_use_dict['other']
    ws['N5'] = ram_zi_use_dict['user']

    ws['O5'] = ram_rw_use_dict['lib'] + ram_rw_use_dict['driver'] + ram_rw_use_dict['other'] + ram_rw_use_dict['user']
    ws['P5'] = ram_rw_use_dict['lib']
    ws['Q5'] = ram_rw_use_dict['driver']
    ws['R5'] = ram_rw_use_dict['other']
    ws['S5'] = ram_rw_use_dict['user']

    ws['T5'] = ram_code_use_dict['lib'] + ram_code_use_dict['driver'] + ram_code_use_dict['other'] + \
        ram_code_use_dict['user']
    ws['U5'] = ram_code_use_dict['lib']
    ws['V5'] = ram_code_use_dict['driver']
    ws['W5'] = ram_code_use_dict['other']
    ws['X5'] = ram_code_use_dict['user']
    ws['Y5'] = BLE_STACK_SIZE
    ws['Z5'] = region_dict['ARM_LIB_STACKHEAP'][0]['size']

    if 'true' == args_param.debug_flag.lower():
        ws = wb.create_sheet()
        ws.column_dimensions['A'].width = 60
        ws.column_dimensions['B'].width = 15
        ws.column_dimensions['C'].width = 15
        current_column = 1

        ws['A1'] = 'File Name'
        ws['B1'] = 'Type'
        ws['C1'] = 'Size(Bytes)'

        flash_dict_list = region_dict['FLASH_CODE'] + region_dict['RAM_RW'] + region_dict['RAM_CODE']

        flash_dict_list.sort(key=lambda x: x.get('size'), reverse=True)
        logging.debug('flash_dict_list: \n{}'.format(flash_dict_list))
        # sorted_list = sorted(test_result_info.items(), key=lambda items: items[1]['rerun_time'], reverse=True)

        for flash_dict in flash_dict_list:
            current_column += 1
            ws['A{}'.format(current_column)] = flash_dict.get('name')
            ws['B{}'.format(current_column)] = flash_dict.get('type')
            ws['C{}'.format(current_column)] = flash_dict.get('size')

    if 'true' == args_param.flash_flag.lower():
        ws = wb.create_sheet(title='Flash_Use')
        ws.column_dimensions['A'].width = 60
        ws.column_dimensions['B'].width = 15
        current_column = 1

        ws['A1'] = 'File Name'
        ws['B1'] = 'Size(Bytes)'

        flash_dict_list = region_dict['FLASH_CODE'] + region_dict['RAM_RW'] + region_dict['RAM_CODE']
        flash_size_dict = {}

        for flash_dict in flash_dict_list:
            if flash_size_dict.get(flash_dict['name']) is None:
                flash_size_dict[flash_dict['name']] = flash_dict.get('size')
            else:
                flash_size_dict[flash_dict['name']] += flash_dict.get('size')

        flash_sorted_list = sorted(flash_size_dict.items(), key=lambda items: items[1], reverse=True)

        for flash_tuple in flash_sorted_list:
            current_column += 1
            ws['A{}'.format(current_column)] = flash_tuple[0]
            ws['B{}'.format(current_column)] = flash_tuple[1]

    if 'true' == args_param.debug_flag.lower():
        ws = wb.create_sheet()
        ws.column_dimensions['A'].width = 60
        ws.column_dimensions['B'].width = 15
        ws.column_dimensions['C'].width = 15
        current_column = 1

        ws['A1'] = 'File Name'
        ws['B1'] = 'Type'
        ws['C1'] = 'Size(Bytes)'

        ram_dict_list = region_dict['RAM_CODE'] + region_dict['RAM_RW'] + region_dict['RAM_ZI']
        ram_dict_list.sort(key=lambda x: x.get('size'), reverse=True)
        logging.debug('ram_dict_list: \n{}'.format(ram_dict_list))

        for ram_dict in ram_dict_list:
            current_column += 1
            ws['A{}'.format(current_column)] = ram_dict.get('name')
            ws['B{}'.format(current_column)] = ram_dict.get('type')
            ws['C{}'.format(current_column)] = ram_dict.get('size')

    if 'true' == args_param.ram_flag.lower():
        ws = wb.create_sheet(title='RAM_Use')
        ws.column_dimensions['A'].width = 60
        ws.column_dimensions['B'].width = 15
        current_column = 1

        ws['A1'] = 'File Name'
        ws['B1'] = 'Size(Bytes)'

        ram_dict_list = region_dict['RAM_CODE'] + region_dict['RAM_RW'] + region_dict['RAM_ZI']
        ram_size_dict = {}

        for ram_dict in ram_dict_list:
            if ram_size_dict.get(ram_dict['name']) is None:
                ram_size_dict[ram_dict['name']] = ram_dict.get('size')
            else:
                ram_size_dict[ram_dict['name']] += ram_dict.get('size')

        ram_sorted_list = sorted(ram_size_dict.items(), key=lambda items: items[1], reverse=True)

        for ram_tuple in ram_sorted_list:
            current_column += 1
            ws['A{}'.format(current_column)] = ram_tuple[0]
            ws['B{}'.format(current_column)] = ram_tuple[1]

    wb.save('{}.xlsx'.format(os.path.join(args_param.map_path, os.path.basename(os.path.splitext(map_file)[0]))))


def get_command_line_parameter():
    parser = argparse.ArgumentParser()

    parser.add_argument('-p', '--path', action='store', dest='map_path', default='.\\build',
                        help='The path of map file')
    # parser.add_argument('-l', '--lib', nargs='+', action='store', dest='lib_files',
    #                     default=['ble_sdk_gr551x_d.lib', 'ble_sdk_gr551x_c.lib', 'ble_sdk_gr551x.lib'],
    #                     help='The library file list')
    parser.add_argument('-s', '--sdk', action='store', dest='sdk_base', default='..\\..\\..\\..\\..\\',
                        help='The sdk base path')
    parser.add_argument('-d', '--debug', action='store', dest='debug_flag', default='False',
                        help='The debug flag')
    parser.add_argument('-f', '--flash', action='store', dest='flash_flag', default='False',
                        help='The flash use flag')
    parser.add_argument('-r', '--ram', action='store', dest='ram_flag', default='False',
                        help='The ram use flag')

    args_param = parser.parse_args()

    return args_param


def main():
    args_param = get_command_line_parameter()

    if 'true' == args_param.debug_flag.lower():
        logging_config(logging.DEBUG)
    else:
        logging_config(logging.INFO)

    map_file_list = get_all_files_with_suffix_by_os_walk(args_param.map_path, MAP_FILE_SUFFIX)

    for map_file in map_file_list:
        print('Start to parse {} file...'.format(os.path.basename(map_file)), flush=True)
        gen_excel_report(map_file, args_param)


if __name__ == "__main__":
    # print("Script start execution at {}".format(str(datetime.datetime.now())))

    time_start = time.time()
    main()

    # print("\n\nTotal Elapsed Time: {} seconds".format(time.time() - time_start))
    # print("\nScript end execution at {}".format(datetime.datetime.now()))
