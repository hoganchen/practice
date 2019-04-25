# -*- coding:utf-8 -*-
"""
@Author:        hogan.chen@ymail.com
@Create Date:   2019-04-09
"""
import os
import re
import time
import logging
import datetime


# log level
LOGGING_LEVEL = logging.INFO


def logging_config(logging_level):
    # log_format = "%(asctime)s - %(levelname)s - %(message)s"
    # log_format = "%(asctime)s [line: %(lineno)d] - %(levelname)s - %(message)s"
    # log_format = "[%(asctime)s - [File: %(filename)s line: %(lineno)d] - %(levelname)s]: %(message)s"
    # log_format = "[Datetime: %(asctime)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s"
    # log_format = "[Time: %(asctime)s -- Func: %(funcName)s -- Line: %(lineno)d -- Level: %(levelname)s]: %(message)s"
    log_format = "[Func: %(funcName)s - Line: %(lineno)d - Level: %(levelname)s]: %(message)s"
    logging.basicConfig(level=logging_level, format=log_format)


def get_all_files_with_suffix(dir_path, suffix=None):
    file_path_list = []

    if os.path.exists(dir_path) and os.path.isdir(dir_path):
        file_list = os.listdir(dir_path)

        for file in file_list:
            file_path = os.path.join(dir_path, file)

            if os.path.isdir(file_path):
                file_path_list.extend(get_all_files_with_suffix(file_path, suffix=suffix))
                # continue
            else:
                if suffix is None:
                    file_path_list.append(file_path)
                else:
                    if re.search(r'{}$'.format(re.escape(suffix)), os.path.split(file_path)[1]):
                        file_path_list.append(file_path)

    logging.debug('In {} folder, File list: {}'.format(dir_path, file_path_list))
    return file_path_list


def tc_xml_convert(folder_path, suffix=None):
    file_path_list = get_all_files_with_suffix(folder_path, suffix=suffix)

    # testlink test case xml format
    # https://stackoverflow.com/questions/23144475/import-test-cases-to-testlink
    # http://demo.testlink.org/latest//docs/tl-file-formats.pdf

    '''
<?xml version="1.0" encoding="UTF-8"?>
<testcases>
<testcase name="NAME_OF_TESTCASE">
    <summary>Description of test case</summary>
    <preconditions>some pre conditions</preconditions>
    <execution_type>2</execution_type>
    <steps>
        <step>
            <step_number>1</step_number>
            <actions>Do a thing</actions>
            <expectedresults>This is what to expect</expectedresults>
            <execution_type>2</execution_type>
        </step>
        <step>
            <step_number>2</step_number>
            <actions>Do another thing</actions>
            <expectedresults>more expected results</expectedresults>
            <execution_type>1</execution_type>
        </step>
    </steps>
    <custom_fields>
        <custom_field>
            <name>some_cf_name</name>
            <value>some_cf_value</value>
        </custom_field>
    </custom_fields>
</testcase>
    '''

    xml_template = '''<?xml version="1.0" encoding="UTF-8"?>
<testcases>
<testcase name="GAP_ADV_BV-01-C">
    <summary></summary>
    <preconditions></preconditions>
    <execution_type>2</execution_type>
    <importance>2</importance>
    <estimated_exec_duration></estimated_exec_duration>
    <status>1</status>
    <is_open>1</is_open>
    <active>1</active>

    <custom_fields>
        <custom_field>
        <name>BLE_AUTO</name>
        <value>GAP_ADV_BV-01-C</value>
        </custom_field>
    </custom_fields>
</testcase>
</testcases>
'''

    xml_template = '''<?xml version="1.0" encoding="UTF-8"?>
<testcases>
<testcase name="GAP_ADV_BV-01-C">
    <summary></summary>
    <preconditions></preconditions>
    <execution_type>2</execution_type>

    <custom_fields>
        <custom_field>
        <name>BLE_AUTO</name>
        <value>GAP_ADV_BV-01-C</value>
        </custom_field>
    </custom_fields>
</testcase>
</testcases>
'''

    xml_header = '''<?xml version="1.0" encoding="UTF-8"?>
<testcases>
'''

    xml_tail = '''</testcases>
'''

    tc_content = '''<testcase name="{0}">
    <summary>{1}</summary>
    <preconditions>{2}</preconditions>
    <execution_type>2</execution_type>
    <importance>2</importance>
    <estimated_exec_duration></estimated_exec_duration>
    <status>1</status>
    <is_open>1</is_open>
    <active>1</active>

    <custom_fields>
        <custom_field>
        <name>BLE_AUTO</name>
        <value>{0}</value>
        </custom_field>
    </custom_fields>
</testcase>
'''

    for file_path in file_path_list:
        logging.info('Start to generate {} file...'.format(os.path.split(file_path)[1].replace(suffix, '.xml')))

        with open('{}.xml'.format(os.path.splitext(file_path)[0]), 'w') as xml_fd:
            xml_fd.write(xml_header)

            with open(file_path, 'r') as file_fd:
                while True:
                    line_str = file_fd.readline()

                    if line_str:
                        line_strip_str = line_str.strip()
                        case_name = ''
                        summary = ''
                        precondition = ''

                        match_obj = re.match(r'^([^~]*)~*([^~]*)~*(.*?)$', line_strip_str)


                        if match_obj:
                            case_name = match_obj.group(1)
                            summary = match_obj.group(2)
                            precondition = match_obj.group(3)

                        if len(line_strip_str) and len(case_name):
                            xml_fd.write('\n')
                            xml_fd.write(tc_content.format(case_name, '<![CDATA[<p>{}</p>\n]]>'.format(summary.replace('\\n', '</p>\n\n<p>')),
                                '<![CDATA[<p>{}</p>\n]]>'.format(precondition.replace('\\n', '</p>\n\n<p>'))))
                            # xml_fd.write(tc_content.format(case_name, '{}'.format(summary.replace('\\n', '\n')), '{}'.format(precondition.replace('\\n', '\n'))))
                    else:
                        break

            xml_fd.write(xml_tail)


def main():
    tc_xml_convert('./tc', '.txt')


if __name__ == '__main__':
    logging_config(LOGGING_LEVEL)

    logging.info('Script start execution at {}'.format(str(datetime.datetime.now())))

    print('-' * 120)

    time_start = time.time()

    main()

    print('-' * 120)

    logging.info('Total elapsed time: {} seconds'.format(time.time() - time_start))
    logging.info('Script end execution at {}'.format(datetime.datetime.now()))
