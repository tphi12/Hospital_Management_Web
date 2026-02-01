import { Outlet } from "react-router-dom";
import { Layout as AntLayout } from "antd";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const { Content, Sider } = AntLayout;

const Layout = () => {
    return (
        <AntLayout className="min-h-screen bg-background">
            <Sider
                width={260}
                theme="light"
                className="h-screen fixed left-0 top-0 bottom-0 z-50 border-r border-slate-200"
            >
                <Sidebar />
            </Sider>

            <AntLayout className="ml-[260px] transition-all duration-200 bg-background">
                <Navbar />
                <Content className="m-6 overflow-initial">
                    <div className="p-6 bg-surface rounded-lg min-h-[360px] shadow-sm">
                        <Outlet />
                    </div>
                </Content>
            </AntLayout>
        </AntLayout>
    );
};

export default Layout;
